import { ObjectId } from "mongodb";

import { getCurrentUser } from "@/app/utils/currentUser";
import { getDatabase } from "@/app/utils/database";
import {
  REPORT_MAX_DETAILS_LENGTH,
  isReportReason,
  isReportTargetType,
} from "@/app/utils/reportConfig";

let reportsIndexesPromise = null;

function createResponse(body, status = 200) {
  return Response.json(body, { status });
}

function createError(message, status) {
  return createResponse(
    {
      success: false,
      message,
    },
    status
  );
}

async function getReportsCollection(database) {
  const reportsCollection = database.collection("reports");

  if (!reportsIndexesPromise) {
    reportsIndexesPromise = Promise.all([
      reportsCollection.createIndex(
        {
          status: 1,
          createdAt: -1,
        },
        {
          name: "reports_by_status",
        }
      ),
      reportsCollection.createIndex(
        {
          reportedBy: 1,
          createdAt: -1,
        },
        {
          name: "reports_by_user",
        }
      ),
      reportsCollection.createIndex(
        {
          targetOwnerId: 1,
          status: 1,
          createdAt: -1,
        },
        {
          name: "reports_by_target_owner",
        }
      ),
      reportsCollection.createIndex(
        {
          targetType: 1,
          targetId: 1,
          reportedBy: 1,
          status: 1,
        },
        {
          name: "unique_pending_report_per_user_target",
          unique: true,
          partialFilterExpression: {
            status: "pending",
          },
        }
      ),
    ]).catch((error) => {
      reportsIndexesPromise = null;
      throw error;
    });
  }

  await reportsIndexesPromise;

  return reportsCollection;
}

function getObjectId(value) {
  const normalizedValue = String(value || "").trim();

  return ObjectId.isValid(normalizedValue)
    ? new ObjectId(normalizedValue)
    : null;
}

function createTargetResult({
  ownerId = null,
  preview = "",
  contextId = null,
}) {
  return {
    found: true,
    hasAccess: true,
    ownerId,
    preview:
      typeof preview === "string"
        ? preview.trim().slice(0, 200)
        : "",
    contextId,
  };
}

function targetNotFound() {
  return {
    found: false,
    hasAccess: false,
    ownerId: null,
    preview: "",
    contextId: null,
  };
}

function targetForbidden() {
  return {
    found: true,
    hasAccess: false,
    ownerId: null,
    preview: "",
    contextId: null,
  };
}

function isParticipant(conversation, userId) {
  return (
    Array.isArray(conversation?.participants) &&
    conversation.participants.some(
      (participantId) =>
        String(participantId) === String(userId)
    )
  );
}

function getOtherParticipantId(conversation, userId) {
  if (!Array.isArray(conversation?.participants)) {
    return null;
  }

  return (
    conversation.participants.find(
      (participantId) =>
        String(participantId) !== String(userId)
    ) || null
  );
}

function getMessagePreview(message) {
  if (message?.isDeleted === true) {
    return "Mesaj șters";
  }

  if (typeof message?.text === "string" && message.text.trim()) {
    return message.text;
  }

  const imageCount = Array.isArray(message?.images)
    ? message.images.length
    : 0;

  if (imageCount === 1) {
    return "Mesaj cu o imagine";
  }

  if (imageCount > 1) {
    return `Mesaj cu ${imageCount} imagini`;
  }

  return "Mesaj";
}

async function getReportTarget({
  database,
  targetType,
  targetObjectId,
  currentUserId,
}) {
  if (targetType === "post") {
    const post = await database.collection("posts").findOne(
      {
        _id: targetObjectId,
      },
      {
        projection: {
          _id: 1,
          userId: 1,
          authorId: 1,
          title: 1,
        },
      }
    );

    if (!post) {
      return targetNotFound();
    }

    return createTargetResult({
      ownerId: post.authorId || post.userId || null,
      preview: post.title || "",
    });
  }

  if (targetType === "comment") {
    const comment = await database.collection("comments").findOne(
      {
        _id: targetObjectId,
      },
      {
        projection: {
          _id: 1,
          userId: 1,
          content: 1,
          postId: 1,
        },
      }
    );

    if (!comment) {
      return targetNotFound();
    }

    return createTargetResult({
      ownerId: comment.userId || null,
      preview: comment.content || "",
      contextId: comment.postId || null,
    });
  }

  if (targetType === "user") {
    const user = await database.collection("users").findOne(
      {
        _id: targetObjectId,
      },
      {
        projection: {
          _id: 1,
          name: 1,
          fullName: 1,
          username: 1,
        },
      }
    );

    if (!user) {
      return targetNotFound();
    }

    const displayName =
      user.name || user.fullName || user.username || "Utilizator";

    return createTargetResult({
      ownerId: user._id,
      preview: user.username
        ? `${displayName} (@${user.username})`
        : displayName,
    });
  }

  if (targetType === "conversation") {
    const conversation = await database
      .collection("conversations")
      .findOne(
        {
          _id: targetObjectId,
        },
        {
          projection: {
            _id: 1,
            participants: 1,
            lastMessage: 1,
            lastMessageType: 1,
          },
        }
      );

    if (!conversation) {
      return targetNotFound();
    }

    if (!isParticipant(conversation, currentUserId)) {
      return targetForbidden();
    }

    const otherParticipantId = getOtherParticipantId(
      conversation,
      currentUserId
    );

    return createTargetResult({
      ownerId: otherParticipantId,
      preview:
        conversation.lastMessage ||
        (conversation.lastMessageType === "image"
          ? "Conversație cu imagini"
          : "Conversație"),
      contextId: conversation._id,
    });
  }

  if (targetType === "message") {
    const message = await database.collection("messages").findOne(
      {
        _id: targetObjectId,
      },
      {
        projection: {
          _id: 1,
          conversationId: 1,
          senderId: 1,
          text: 1,
          images: 1,
          isDeleted: 1,
          deletedFor: 1,
        },
      }
    );

    if (!message?.conversationId) {
      return targetNotFound();
    }

    const conversation = await database
      .collection("conversations")
      .findOne(
        {
          _id: message.conversationId,
        },
        {
          projection: {
            _id: 1,
            participants: 1,
          },
        }
      );

    if (!conversation) {
      return targetNotFound();
    }

    if (!isParticipant(conversation, currentUserId)) {
      return targetForbidden();
    }

    const isHiddenForCurrentUser =
      Array.isArray(message.deletedFor) &&
      message.deletedFor.some(
        (userId) => String(userId) === String(currentUserId)
      );

    if (isHiddenForCurrentUser) {
      return targetNotFound();
    }

    return createTargetResult({
      ownerId: message.senderId || null,
      preview: getMessagePreview(message),
      contextId: message.conversationId,
    });
  }

  return targetNotFound();
}

function getTargetNotFoundMessage(targetType) {
  const messages = {
    post: "Postarea nu a fost găsită.",
    comment: "Comentariul nu a fost găsit.",
    conversation: "Conversația nu a fost găsită.",
    message: "Mesajul nu a fost găsit.",
    user: "Utilizatorul nu a fost găsit.",
  };

  return messages[targetType] || "Conținutul nu a fost găsit.";
}

export async function POST(request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?._id) {
      return createError(
        "Trebuie să fii autentificat pentru a trimite un raport.",
        401
      );
    }

    const currentUserId = getObjectId(currentUser._id);

    if (!currentUserId) {
      return createError("Utilizatorul autentificat nu este valid.", 401);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return createError("Datele raportului nu sunt valide.", 400);
    }

    const targetType =
      typeof body?.targetType === "string"
        ? body.targetType.trim().toLowerCase()
        : "";
    const targetId =
      typeof body?.targetId === "string"
        ? body.targetId.trim()
        : "";
    const reason =
      typeof body?.reason === "string"
        ? body.reason.trim().toLowerCase()
        : "";
    const details =
      typeof body?.details === "string"
        ? body.details.trim()
        : "";

    if (!isReportTargetType(targetType)) {
      return createError(
        "Tipul conținutului raportat nu este valid.",
        400
      );
    }

    const targetObjectId = getObjectId(targetId);

    if (!targetObjectId) {
      return createError("Conținutul raportat nu este valid.", 400);
    }

    if (!isReportReason(reason)) {
      return createError(
        "Selectează un motiv valid pentru raportare.",
        400
      );
    }

    if (reason === "other" && !details) {
      return createError("Descrie motivul raportării.", 400);
    }

    if (details.length > REPORT_MAX_DETAILS_LENGTH) {
      return createError(
        `Detaliile raportului pot avea maximum ${REPORT_MAX_DETAILS_LENGTH} de caractere.`,
        400
      );
    }

    const database = await getDatabase();
    const target = await getReportTarget({
      database,
      targetType,
      targetObjectId,
      currentUserId,
    });

    if (!target.found) {
      return createError(getTargetNotFoundMessage(targetType), 404);
    }

    if (!target.hasAccess) {
      return createError("Nu ai acces la conținutul raportat.", 403);
    }

    if (
      target.ownerId &&
      String(target.ownerId) === String(currentUserId)
    ) {
      return createError(
        "Nu îți poți raporta propriul conținut sau propriul cont.",
        400
      );
    }

    const reportsCollection = await getReportsCollection(database);
    const existingReport = await reportsCollection.findOne(
      {
        targetType,
        targetId: targetObjectId,
        reportedBy: currentUserId,
        status: "pending",
      },
      {
        projection: {
          _id: 1,
        },
      }
    );

    if (existingReport) {
      return createError(
        "Ai raportat deja acest conținut. Echipa de suport îl va verifica.",
        409
      );
    }

    const now = new Date();
    const report = {
      targetType,
      targetId: targetObjectId,
      targetOwnerId: target.ownerId || null,
      targetContextId: target.contextId || null,
      targetPreview: target.preview,
      reportedBy: currentUserId,
      reportedByUsername: currentUser.username || "",
      reason,
      details,
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
      resolution: "",
      createdAt: now,
      updatedAt: now,
    };

    let insertResult;

    try {
      insertResult = await reportsCollection.insertOne(report);
    } catch (error) {
      if (error?.code === 11000) {
        return createError(
          "Ai raportat deja acest conținut. Echipa de suport îl va verifica.",
          409
        );
      }

      throw error;
    }

    return createResponse(
      {
        success: true,
        message: "Raportul a fost trimis către echipa de suport.",
        report: {
          ...report,
          _id: insertResult.insertedId.toString(),
          targetId: report.targetId.toString(),
          targetOwnerId: report.targetOwnerId?.toString?.() || null,
          targetContextId:
            report.targetContextId?.toString?.() || null,
          reportedBy: report.reportedBy.toString(),
        },
      },
      201
    );
  } catch (error) {
    console.error("POST /api/reports error:", error);

    return createError("Raportul nu a putut fi trimis.", 500);
  }
}
