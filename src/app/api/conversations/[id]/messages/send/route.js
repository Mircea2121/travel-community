import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getCurrentUser } from "@/app/utils/currentUser";
import {
  getConversationsCollection,
  getMessagesCollection,
} from "@/app/utils/database";
import { serializeMessage } from "@/app/utils/messageSerializer";

const MESSAGE_MAX_LENGTH = 2000;
const MESSAGE_MAX_IMAGES = 5;
const CLOUDINARY_HOSTNAME = "res.cloudinary.com";

function createError(message, status) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );
}

function normalizeImageNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) && number > 0
    ? number
    : null;
}

function normalizeImages(value, { conversationId, userId }) {
  if (value === undefined || value === null) {
    return { images: [] };
  }

  if (!Array.isArray(value)) {
    return {
      error: "Imaginile trimise nu sunt valide.",
    };
  }

  if (value.length > MESSAGE_MAX_IMAGES) {
    return {
      error: `Poți trimite maximum ${MESSAGE_MAX_IMAGES} imagini într-un singur mesaj.`,
    };
  }

  const expectedPublicIdPrefix =
    `travel-community/messages/${conversationId}/${userId}/`;

  const images = [];
  const usedPublicIds = new Set();

  for (const image of value) {
    if (!image || typeof image !== "object" || Array.isArray(image)) {
      return {
        error: "Una dintre imaginile trimise nu este validă.",
      };
    }

    const url =
      typeof image.url === "string"
        ? image.url.trim()
        : "";

    const publicId =
      typeof image.publicId === "string"
        ? image.publicId.trim()
        : "";

    if (!url || !publicId) {
      return {
        error: "Una dintre imaginile trimise este incompletă.",
      };
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(url);
    } catch {
      return {
        error: "Adresa uneia dintre imagini nu este validă.",
      };
    }

    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.hostname !== CLOUDINARY_HOSTNAME ||
      !publicId.startsWith(expectedPublicIdPrefix)
    ) {
      return {
        error: "Una dintre imaginile trimise nu aparține acestui mesaj.",
      };
    }

    if (usedPublicIds.has(publicId)) {
      return {
        error: "Aceeași imagine nu poate fi adăugată de mai multe ori.",
      };
    }

    usedPublicIds.add(publicId);

    images.push({
      url,
      publicId,
      width: normalizeImageNumber(image.width),
      height: normalizeImageNumber(image.height),
      format:
        typeof image.format === "string"
          ? image.format.trim().toLowerCase()
          : "",
      bytes: normalizeImageNumber(image.bytes),
      originalName:
        typeof image.originalName === "string"
          ? image.originalName.trim().slice(0, 255)
          : "",
      createdAt: new Date(),
    });
  }

  return { images };
}

function getReplyToId(body) {
  const value = body?.replyTo ?? body?.replyToId ?? null;

  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return String(value._id || value.id || "").trim();
  }

  return String(value).trim();
}

export async function POST(request, { params }) {
  let insertedMessageId = null;

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?._id) {
      return createError("Trebuie să fii autentificat.", 401);
    }

    const { id } = await params;
    const conversationId = String(id || "").trim();

    if (!ObjectId.isValid(conversationId)) {
      return createError("Conversația este invalidă.", 400);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return createError("Datele mesajului nu sunt valide.", 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return createError("Datele mesajului nu sunt valide.", 400);
    }

    if (body.text !== undefined && typeof body.text !== "string") {
      return createError("Textul mesajului nu este valid.", 400);
    }

    const text =
      typeof body.text === "string"
        ? body.text.trim()
        : "";

    if (text.length > MESSAGE_MAX_LENGTH) {
      return createError(
        `Mesajul poate avea maximum ${MESSAGE_MAX_LENGTH} de caractere.`,
        400
      );
    }

    const currentUserId =
      currentUser._id instanceof ObjectId
        ? currentUser._id
        : new ObjectId(String(currentUser._id));

    const normalizedImages = normalizeImages(body.images, {
      conversationId,
      userId: currentUserId.toString(),
    });

    if (normalizedImages.error) {
      return createError(normalizedImages.error, 400);
    }

    const images = normalizedImages.images;

    if (!text && images.length === 0) {
      return createError(
        "Mesajul trebuie să conțină text sau cel puțin o imagine.",
        400
      );
    }

    const replyToId = getReplyToId(body);

    if (replyToId && !ObjectId.isValid(replyToId)) {
      return createError("Mesajul la care răspunzi este invalid.", 400);
    }

    const conversationObjectId = new ObjectId(conversationId);
    const replyTo = replyToId ? new ObjectId(replyToId) : null;

    const conversationsCollection =
      await getConversationsCollection();
    const messagesCollection = await getMessagesCollection();

    const conversation = await conversationsCollection.findOne({
      _id: conversationObjectId,
      participants: currentUserId,
    });

    if (!conversation) {
      return createError(
        "Conversația nu există sau nu ai acces la ea.",
        404
      );
    }

    const participants = Array.isArray(conversation.participants)
      ? conversation.participants
      : [];

    if (participants.length < 2) {
      return createError("Conversația nu are participanți valizi.", 409);
    }

    let replyToMessage = null;

    if (replyTo) {
      replyToMessage = await messagesCollection.findOne({
        _id: replyTo,
        conversationId: conversationObjectId,
        deletedFor: {
          $ne: currentUserId,
        },
      });

      if (!replyToMessage) {
        return createError(
          "Mesajul la care încerci să răspunzi nu există.",
          404
        );
      }
    }

    const now = new Date();
    const messageType =
      text && images.length > 0
        ? "mixed"
        : images.length > 0
          ? "image"
          : "text";

    const messageDocument = {
      conversationId: conversationObjectId,
      senderId: currentUserId,
      text,
      images,
      messageType,
      replyTo,
      reactions: [],
      seenBy: [
        {
          userId: currentUserId,
          seenAt: now,
        },
      ],
      deletedFor: [],
      isRead: false,
      isEdited: false,
      editedAt: null,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      deliveredAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const insertResult =
      await messagesCollection.insertOne(messageDocument);

    insertedMessageId = insertResult.insertedId;
    messageDocument._id = insertResult.insertedId;

    const lastMessage =
      messageType === "image"
        ? images.length === 1
          ? "Imagine"
          : `${images.length} imagini`
        : text;

    const conversationUpdate =
      await conversationsCollection.updateOne(
        {
          _id: conversationObjectId,
          participants: currentUserId,
        },
        {
          $set: {
            lastMessage,
            lastMessageType: messageType,
            lastMessageSenderId: currentUserId,
            lastMessageAt: now,
            updatedAt: now,
          },
          $pull: {
            hiddenFor: {
              $in: participants,
            },
          },
        }
      );

    if (conversationUpdate.matchedCount !== 1) {
      await messagesCollection.deleteOne({
        _id: insertedMessageId,
      });

      insertedMessageId = null;

      return createError("Mesajul nu a putut fi trimis.", 409);
    }

    const serializedMessage = serializeMessage(messageDocument, {
      replyToMessage,
    });

    return NextResponse.json(
      {
        success: true,
        message: serializedMessage,
      },
      { status: 201 }
    );
  } catch (error) {
    if (insertedMessageId) {
      try {
        const messagesCollection = await getMessagesCollection();

        await messagesCollection.deleteOne({
          _id: insertedMessageId,
        });
      } catch (cleanupError) {
        console.error(
          "POST /api/conversations/[id]/messages/send cleanup error:",
          cleanupError
        );
      }
    }

    console.error(
      "POST /api/conversations/[id]/messages/send error:",
      error
    );

    return createError("Mesajul nu a putut fi trimis.", 500);
  }
}
