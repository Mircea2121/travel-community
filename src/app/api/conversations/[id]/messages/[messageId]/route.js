import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getCurrentUser } from "@/app/utils/currentUser";
import {
  getConversationsCollection,
  getMessagesCollection,
} from "@/app/utils/database";
import {
  MESSAGE_POLICY,
  canDeleteMessageForEveryone,
  canEditMessage,
} from "@/app/utils/messagePolicy";
import { serializeMessage } from "@/app/utils/messageSerializer";
import { deleteMessageImages } from "@/app/utils/uploadMessageImages";

const DELETE_SCOPES = new Set(["me", "everyone"]);

function createError(message, status) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );
}

async function getRequestContext(params) {
  const currentUser = await getCurrentUser();

  if (!currentUser?._id) {
    return {
      error: createError("Trebuie să fii autentificat.", 401),
    };
  }

  const resolvedParams = await params;
  const conversationId = String(resolvedParams?.id || "").trim();
  const messageId = String(resolvedParams?.messageId || "").trim();

  if (!ObjectId.isValid(conversationId)) {
    return {
      error: createError("Conversația este invalidă.", 400),
    };
  }

  if (!ObjectId.isValid(messageId)) {
    return {
      error: createError("Mesajul este invalid.", 400),
    };
  }

  const currentUserId =
    currentUser._id instanceof ObjectId
      ? currentUser._id
      : new ObjectId(String(currentUser._id));
  const conversationObjectId = new ObjectId(conversationId);
  const messageObjectId = new ObjectId(messageId);
  const conversationsCollection =
    await getConversationsCollection();

  const conversation = await conversationsCollection.findOne(
    {
      _id: conversationObjectId,
      participants: currentUserId,
    },
    {
      projection: {
        _id: 1,
      },
    }
  );

  if (!conversation) {
    return {
      error: createError(
        "Conversația nu există sau nu ai acces la ea.",
        404
      ),
    };
  }

  return {
    currentUserId,
    conversationObjectId,
    messageObjectId,
    conversationsCollection,
  };
}

async function getReplyToMessage(messagesCollection, message) {
  if (!message?.replyTo) {
    return null;
  }

  return messagesCollection.findOne(
    {
      _id: message.replyTo,
      conversationId: message.conversationId,
    },
    {
      projection: {
        _id: 1,
        senderId: 1,
        text: 1,
        images: 1,
        messageType: 1,
        isDeleted: 1,
      },
    }
  );
}

async function isLatestMessage(
  messagesCollection,
  conversationId,
  messageId
) {
  const latestMessage = await messagesCollection.findOne(
    {
      conversationId,
    },
    {
      projection: {
        _id: 1,
      },
      sort: {
        createdAt: -1,
        _id: -1,
      },
    }
  );

  return String(latestMessage?._id || "") === String(messageId);
}

function getMessagePreview(message) {
  if (message.isDeleted === true) {
    return "Mesaj șters";
  }

  if (typeof message.text === "string" && message.text.trim()) {
    return message.text.trim();
  }

  const imageCount = Array.isArray(message.images)
    ? message.images.length
    : 0;

  if (imageCount === 1) {
    return "Imagine";
  }

  if (imageCount > 1) {
    return `${imageCount} imagini`;
  }

  return "";
}

async function updateConversationPreview(
  conversationsCollection,
  message,
  now
) {
  await conversationsCollection.updateOne(
    {
      _id: message.conversationId,
    },
    {
      $set: {
        lastMessage: getMessagePreview(message),
        lastMessageType: message.messageType,
        lastMessageSenderId: message.senderId,
        lastMessageAt: message.createdAt,
        updatedAt: now,
      },
    }
  );
}

export async function PATCH(request, { params }) {
  try {
    const context = await getRequestContext(params);

    if (context.error) {
      return context.error;
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return createError("Datele mesajului nu sunt valide.", 400);
    }

    if (typeof body?.text !== "string") {
      return createError("Textul mesajului nu este valid.", 400);
    }

    const text = body.text.trim();

    if (text.length > MESSAGE_POLICY.MAX_TEXT_LENGTH) {
      return createError(
        `Mesajul poate avea maximum ${MESSAGE_POLICY.MAX_TEXT_LENGTH} de caractere.`,
        400
      );
    }

    const {
      currentUserId,
      conversationObjectId,
      messageObjectId,
      conversationsCollection,
    } = context;
    const messagesCollection = await getMessagesCollection();
    const message = await messagesCollection.findOne({
      _id: messageObjectId,
      conversationId: conversationObjectId,
    });

    if (!message) {
      return createError("Mesajul nu a fost găsit.", 404);
    }

    if (String(message.senderId) !== String(currentUserId)) {
      return createError("Poți edita doar mesajele tale.", 403);
    }

    if (message.isDeleted === true) {
      return createError("Un mesaj șters nu mai poate fi editat.", 409);
    }

    const now = new Date();

    if (!canEditMessage(message.createdAt, now)) {
      return createError(
        "Mesajul poate fi editat numai în primele 15 minute.",
        409
      );
    }

    const images = Array.isArray(message.images) ? message.images : [];

    if (!text && images.length === 0) {
      return createError("Mesajul nu poate fi gol.", 400);
    }

    const messageType =
      text && images.length > 0
        ? "mixed"
        : images.length > 0
          ? "image"
          : "text";

    if (text === (message.text || "") && messageType === message.messageType) {
      const replyToMessage = await getReplyToMessage(
        messagesCollection,
        message
      );

      return NextResponse.json({
        success: true,
        message: serializeMessage(message, {
          replyToMessage,
        }),
      });
    }

    const updateResult = await messagesCollection.updateOne(
      {
        _id: messageObjectId,
        conversationId: conversationObjectId,
        senderId: currentUserId,
        isDeleted: {
          $ne: true,
        },
        updatedAt: message.updatedAt,
      },
      {
        $set: {
          text,
          messageType,
          isEdited: true,
          editedAt: now,
          updatedAt: now,
        },
      }
    );

    if (updateResult.matchedCount !== 1) {
      return createError(
        "Mesajul a fost modificat între timp. Reîncarcă conversația.",
        409
      );
    }

    const updatedMessage = {
      ...message,
      text,
      messageType,
      isEdited: true,
      editedAt: now,
      updatedAt: now,
    };

    if (
      await isLatestMessage(
        messagesCollection,
        conversationObjectId,
        messageObjectId
      )
    ) {
      await updateConversationPreview(
        conversationsCollection,
        updatedMessage,
        now
      );
    }

    const replyToMessage = await getReplyToMessage(
      messagesCollection,
      updatedMessage
    );

    return NextResponse.json({
      success: true,
      message: serializeMessage(updatedMessage, {
        replyToMessage,
      }),
    });
  } catch (error) {
    console.error(
      "PATCH /api/conversations/[id]/messages/[messageId] error:",
      error
    );

    return createError("Mesajul nu a putut fi editat.", 500);
  }
}

export async function DELETE(request, { params }) {
  try {
    const context = await getRequestContext(params);

    if (context.error) {
      return context.error;
    }

    const url = new URL(request.url);
    let scope = url.searchParams.get("scope")?.trim().toLowerCase() || "";

    if (!scope) {
      try {
        const body = await request.json();

        scope =
          typeof body?.scope === "string"
            ? body.scope.trim().toLowerCase()
            : "";
      } catch {
        scope = "";
      }
    }

    if (!DELETE_SCOPES.has(scope)) {
      return createError(
        "Alege dacă mesajul se șterge pentru tine sau pentru toți.",
        400
      );
    }

    const {
      currentUserId,
      conversationObjectId,
      messageObjectId,
      conversationsCollection,
    } = context;
    const messagesCollection = await getMessagesCollection();
    const message = await messagesCollection.findOne({
      _id: messageObjectId,
      conversationId: conversationObjectId,
    });

    if (!message) {
      return createError("Mesajul nu a fost găsit.", 404);
    }

    const now = new Date();

    if (scope === "me") {
      const updateResult = await messagesCollection.updateOne(
        {
          _id: messageObjectId,
          conversationId: conversationObjectId,
        },
        {
          $addToSet: {
            deletedFor: currentUserId,
          },
        }
      );

      if (updateResult.matchedCount !== 1) {
        return createError("Mesajul nu a putut fi șters.", 409);
      }

      return NextResponse.json({
        success: true,
        deletion: {
          conversationId: conversationObjectId.toString(),
          messageId: messageObjectId.toString(),
          scope: "me",
          deletedAt: now.toISOString(),
        },
      });
    }

    if (String(message.senderId) !== String(currentUserId)) {
      return createError(
        "Poți șterge pentru toți numai mesajele tale.",
        403
      );
    }

    if (message.isDeleted === true) {
      return NextResponse.json({
        success: true,
        deletion: {
          conversationId: conversationObjectId.toString(),
          messageId: messageObjectId.toString(),
          scope: "everyone",
          deletedAt:
            message.deletedAt?.toISOString?.() || now.toISOString(),
        },
      });
    }

    if (!canDeleteMessageForEveryone(message.createdAt, now)) {
      return createError(
        "Mesajul poate fi șters pentru toți numai în prima oră.",
        409
      );
    }

    const images = Array.isArray(message.images) ? message.images : [];
    const updateResult = await messagesCollection.updateOne(
      {
        _id: messageObjectId,
        conversationId: conversationObjectId,
        senderId: currentUserId,
        isDeleted: {
          $ne: true,
        },
        updatedAt: message.updatedAt,
      },
      {
        $set: {
          text: "",
          images: [],
          messageType: "deleted",
          reactions: [],
          isDeleted: true,
          deletedAt: now,
          deletedBy: currentUserId,
          updatedAt: now,
        },
      }
    );

    if (updateResult.matchedCount !== 1) {
      return createError(
        "Mesajul a fost modificat între timp. Reîncarcă conversația.",
        409
      );
    }

    const deletedMessage = {
      ...message,
      text: "",
      images: [],
      messageType: "deleted",
      reactions: [],
      isDeleted: true,
      deletedAt: now,
      deletedBy: currentUserId,
      updatedAt: now,
    };

    if (
      await isLatestMessage(
        messagesCollection,
        conversationObjectId,
        messageObjectId
      )
    ) {
      await updateConversationPreview(
        conversationsCollection,
        deletedMessage,
        now
      );
    }

    await deleteMessageImages(images);

    return NextResponse.json({
      success: true,
      deletion: {
        conversationId: conversationObjectId.toString(),
        messageId: messageObjectId.toString(),
        scope: "everyone",
        deletedAt: now.toISOString(),
      },
      message: serializeMessage(deletedMessage),
    });
  } catch (error) {
    console.error(
      "DELETE /api/conversations/[id]/messages/[messageId] error:",
      error
    );

    return createError("Mesajul nu a putut fi șters.", 500);
  }
}
