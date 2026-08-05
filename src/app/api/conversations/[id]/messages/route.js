import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getCurrentUser } from "@/app/utils/currentUser";
import {
  getConversationsCollection,
  getMessagesCollection,
} from "@/app/utils/database";
import { serializeMessages } from "@/app/utils/messageSerializer";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

function createError(message, status) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );
}

function getPageSize(searchParams) {
  const rawLimit = searchParams.get("limit");

  if (rawLimit === null || rawLimit === "") {
    return DEFAULT_PAGE_SIZE;
  }

  if (!/^\d+$/.test(rawLimit)) {
    return null;
  }

  const limit = Number(rawLimit);

  if (!Number.isSafeInteger(limit) || limit < 1) {
    return null;
  }

  return Math.min(limit, MAX_PAGE_SIZE);
}

function encodeCursor(message) {
  if (!message?._id || !message?.createdAt) {
    return null;
  }

  const createdAt = new Date(message.createdAt);

  if (Number.isNaN(createdAt.getTime())) {
    return null;
  }

  return Buffer.from(
    JSON.stringify({
      createdAt: createdAt.toISOString(),
      id: message._id.toString(),
    }),
    "utf8"
  ).toString("base64url");
}

function decodeCursor(value) {
  if (!value) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    );

    if (
      !decoded ||
      typeof decoded.createdAt !== "string" ||
      typeof decoded.id !== "string" ||
      !ObjectId.isValid(decoded.id)
    ) {
      return null;
    }

    const createdAt = new Date(decoded.createdAt);

    if (Number.isNaN(createdAt.getTime())) {
      return null;
    }

    return {
      createdAt,
      id: new ObjectId(decoded.id),
    };
  } catch {
    return null;
  }
}

function createCursorFilter(cursor) {
  if (!cursor) {
    return null;
  }

  return {
    $or: [
      {
        createdAt: {
          $lt: cursor.createdAt,
        },
      },
      {
        createdAt: cursor.createdAt,
        _id: {
          $lt: cursor.id,
        },
      },
    ],
  };
}

async function getReplyMessages(
  messagesCollection,
  messages,
  conversationId
) {
  const replyIds = [];
  const usedReplyIds = new Set();

  for (const message of messages) {
    const replyId = message?.replyTo?.toString?.();

    if (
      replyId &&
      ObjectId.isValid(replyId) &&
      !usedReplyIds.has(replyId)
    ) {
      usedReplyIds.add(replyId);
      replyIds.push(new ObjectId(replyId));
    }
  }

  if (replyIds.length === 0) {
    return new Map();
  }

  const replyMessages = await messagesCollection
    .find(
      {
        _id: {
          $in: replyIds,
        },
        conversationId,
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
    )
    .toArray();

  return new Map(
    replyMessages.map((message) => [
      message._id.toString(),
      message,
    ])
  );
}

export async function GET(request, { params }) {
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

    const url = new URL(request.url);
    const pageSize = getPageSize(url.searchParams);

    if (pageSize === null) {
      return createError("Limita de mesaje este invalidă.", 400);
    }

    const rawCursor = url.searchParams.get("cursor");
    const cursor = decodeCursor(rawCursor);

    if (rawCursor && !cursor) {
      return createError("Cursorul de paginare este invalid.", 400);
    }

    const currentUserId =
      currentUser._id instanceof ObjectId
        ? currentUser._id
        : new ObjectId(String(currentUser._id));

    const conversationObjectId = new ObjectId(conversationId);
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
      return createError(
        "Conversația nu există sau nu ai acces la ea.",
        404
      );
    }

    const cursorFilter = createCursorFilter(cursor);
    const messageFilter = {
      conversationId: conversationObjectId,
      deletedFor: {
        $ne: currentUserId,
      },
      ...(cursorFilter ? cursorFilter : {}),
    };

    const messagesCollection = await getMessagesCollection();
    const documents = await messagesCollection
      .find(messageFilter)
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .limit(pageSize + 1)
      .toArray();

    const hasMore = documents.length > pageSize;
    const pageDocuments = hasMore
      ? documents.slice(0, pageSize)
      : documents;

    const oldestMessage =
      pageDocuments[pageDocuments.length - 1] || null;

    const replyMessagesById = await getReplyMessages(
      messagesCollection,
      pageDocuments,
      conversationObjectId
    );

    const messages = serializeMessages(
      [...pageDocuments].reverse(),
      replyMessagesById
    );

    return NextResponse.json({
      success: true,
      messages,
      pagination: {
        hasMore,
        nextCursor: hasMore
          ? encodeCursor(oldestMessage)
          : null,
        limit: pageSize,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/conversations/[id]/messages error:",
      error
    );

    return createError("Mesajele nu au putut fi încărcate.", 500);
  }
}
