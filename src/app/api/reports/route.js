import { ObjectId } from "mongodb";

import { getCurrentUser } from "../../utils/currentUser";
import { getDatabase } from "../../utils/database";

const REPORT_REASONS = [
  "spam",
  "offensive_language",
  "harassment",
  "sexual_content",
  "violence",
  "false_information",
  "fraud",
  "other",
];

const REPORT_TARGET_TYPES = [
  "post",
  "comment",
];

const MAX_DETAILS_LENGTH = 1000;

let reportsIndexesPromise = null;

async function getReportsCollection() {
  const database = await getDatabase();

  const reportsCollection =
    database.collection("reports");

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
          targetType: 1,
          targetId: 1,
          reportedBy: 1,
          status: 1,
        },
        {
          name: "prevent_duplicate_pending_reports",
        }
      ),
    ]);
  }

  await reportsIndexesPromise;

  return reportsCollection;
}

function getObjectId(value) {
  if (!value || !ObjectId.isValid(value)) {
    return null;
  }

  return new ObjectId(value);
}

function getCurrentUserObjectId(currentUser) {
  return getObjectId(
    String(currentUser?._id || "")
  );
}

async function getReportTarget({
  database,
  targetType,
  targetObjectId,
}) {
  if (targetType === "post") {
    const postsCollection =
      database.collection("posts");

    const post =
      await postsCollection.findOne(
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
      return null;
    }

    return {
      ownerId:
        post.authorId ||
        post.userId ||
        null,

      targetPreview:
        typeof post.title === "string"
          ? post.title.slice(0, 200)
          : "",
    };
  }

  if (targetType === "comment") {
    const commentsCollection =
      database.collection("comments");

    const comment =
      await commentsCollection.findOne(
        {
          _id: targetObjectId,
        },
        {
          projection: {
            _id: 1,
            userId: 1,
            content: 1,
          },
        }
      );

    if (!comment) {
      return null;
    }

    return {
      ownerId: comment.userId || null,

      targetPreview:
        typeof comment.content === "string"
          ? comment.content.slice(0, 200)
          : "",
    };
  }

  return null;
}

export async function POST(request) {
  try {
    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return Response.json(
        {
          success: false,
          message:
            "Trebuie să fii autentificat pentru a trimite un raport.",
        },
        {
          status: 401,
        }
      );
    }

    const currentUserObjectId =
      getCurrentUserObjectId(currentUser);

    if (!currentUserObjectId) {
      return Response.json(
        {
          success: false,
          message:
            "Utilizatorul autentificat nu este valid.",
        },
        {
          status: 401,
        }
      );
    }

    let requestBody;

    try {
      requestBody =
        await request.json();
    } catch {
      return Response.json(
        {
          success: false,
          message:
            "Datele raportului nu sunt valide.",
        },
        {
          status: 400,
        }
      );
    }

    const targetType =
      typeof requestBody?.targetType ===
      "string"
        ? requestBody.targetType.trim()
        : "";

    const targetId =
      typeof requestBody?.targetId ===
      "string"
        ? requestBody.targetId.trim()
        : "";

    const reason =
      typeof requestBody?.reason ===
      "string"
        ? requestBody.reason.trim()
        : "";

    const details =
      typeof requestBody?.details ===
      "string"
        ? requestBody.details.trim()
        : "";

    if (
      !REPORT_TARGET_TYPES.includes(
        targetType
      )
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Tipul conținutului raportat nu este valid.",
        },
        {
          status: 400,
        }
      );
    }

    const targetObjectId =
      getObjectId(targetId);

    if (!targetObjectId) {
      return Response.json(
        {
          success: false,
          message:
            "Conținutul raportat nu este valid.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !REPORT_REASONS.includes(reason)
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Selectează un motiv valid pentru raportare.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      reason === "other" &&
      !details
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Descrie motivul raportării.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      details.length >
      MAX_DETAILS_LENGTH
    ) {
      return Response.json(
        {
          success: false,
          message:
            `Detaliile raportului pot avea maximum ${MAX_DETAILS_LENGTH} de caractere.`,
        },
        {
          status: 400,
        }
      );
    }

    const database =
      await getDatabase();

    const target =
      await getReportTarget({
        database,
        targetType,
        targetObjectId,
      });

    if (!target) {
      return Response.json(
        {
          success: false,
          message:
            targetType === "post"
              ? "Postarea nu a fost găsită."
              : "Comentariul nu a fost găsit.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      target.ownerId &&
      String(target.ownerId) ===
        String(currentUserObjectId)
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Nu îți poți raporta propriul conținut.",
        },
        {
          status: 400,
        }
      );
    }

    const reportsCollection =
      await getReportsCollection();

    const existingReport =
      await reportsCollection.findOne({
        targetType,
        targetId: targetObjectId,
        reportedBy:
          currentUserObjectId,
        status: "pending",
      });

    if (existingReport) {
      return Response.json(
        {
          success: false,
          message:
            "Ai raportat deja acest conținut. Echipa de support îl va verifica.",
        },
        {
          status: 409,
        }
      );
    }

    const now = new Date();

    const newReport = {
      targetType,
      targetId: targetObjectId,

      targetOwnerId:
        target.ownerId || null,

      targetPreview:
        target.targetPreview,

      reportedBy:
        currentUserObjectId,

      reportedByUsername:
        currentUser.username || "",

      reason,
      details,

      status: "pending",

      reviewedBy: null,
      reviewedAt: null,
      resolution: "",

      createdAt: now,
      updatedAt: now,
    };

    const insertResult =
      await reportsCollection.insertOne(
        newReport
      );

    return Response.json(
      {
        success: true,
        message:
          "Raportul a fost trimis către echipa de support.",

        report: {
          ...newReport,
          _id: String(
            insertResult.insertedId
          ),
          targetId: String(
            newReport.targetId
          ),
          targetOwnerId:
            newReport.targetOwnerId
              ? String(
                  newReport.targetOwnerId
                )
              : null,
          reportedBy: String(
            newReport.reportedBy
          ),
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Eroare la trimiterea raportului:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Raportul nu a putut fi trimis.",
      },
      {
        status: 500,
      }
    );
  }
}