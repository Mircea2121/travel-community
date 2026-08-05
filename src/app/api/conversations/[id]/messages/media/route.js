import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getCurrentUser } from "@/app/utils/currentUser";
import {
  getConversationsCollection,
  getMessagesCollection,
} from "@/app/utils/database";
import { serializeMessageImage } from "@/app/utils/messageSerializer";

const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 60;
const VALID_DIRECTIONS = new Set(["older", "newer"]);

function createError(message, status) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );
}

function serializeDate(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
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
      typeof decoded?.createdAt !== "string" ||
      typeof decoded?.id !== "string" ||
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

function createBoundaryFilter(cursor, direction, includeBoundary = false) {
  const dateOperator =
    direction === "newer"
      ? "$gt"
      : "$lt";
  const idOperator =
    direction === "newer"
      ? includeBoundary
        ? "$gte"
        : "$gt"
      : includeBoundary
        ? "$lte"
        : "$lt";

  return {
    $or: [
      {
        createdAt: {
          [dateOperator]: cursor.createdAt,
        },
      },
      {
        createdAt: cursor.createdAt,
        _id: {
          [idOperator]: cursor.id,
        },
      },
    ],
  };
}

function createMediaFilter(conversationId, currentUserId) {
  return {
    conversationId,
    isDeleted: {
      $ne: true,
    },
    deletedFor: {
      $ne: currentUserId,
    },
    "images.0": {
      $exists: true,
    },
  };
}

function serializeMediaItems(messages) {
  const items = [];

  for (const message of messages) {
    const messageId = message?._id?.toString?.();
    const senderId = message?.senderId?.toString?.();
    const createdAt = serializeDate(message?.createdAt);

    if (!messageId || !senderId || !createdAt) {
      continue;
    }

    const images = Array.isArray(message.images) ? message.images : [];

    images.forEach((image, imageIndex) => {
      const serializedImage = serializeMessageImage(image);

      if (!serializedImage) {
        return;
      }

      items.push({
        id:
          serializedImage.publicId ||
          `${messageId}:${imageIndex}`,
        messageId,
        imageIndex,
        senderId,
        messageCreatedAt: createdAt,
        ...serializedImage,
      });
    });
  }

  return items;
}

async function findPage({
  messagesCollection,
  baseFilter,
  cursor,
  direction,
  limit,
  includeBoundary = false,
}) {
  const isNewer = direction === "newer";
  const documents = await messagesCollection
    .find(
      {
        ...baseFilter,
        ...createBoundaryFilter(
          cursor,
          direction,
          includeBoundary
        ),
      },
      {
        projection: {
          _id: 1,
          senderId: 1,
          images: 1,
          createdAt: 1,
        },
      }
    )
    .sort({
      createdAt: isNewer ? 1 : -1,
      _id: isNewer ? 1 : -1,
    })
    .limit(limit + 1)
    .toArray();

  const hasMore = documents.length > limit;
  const page = hasMore ? documents.slice(0, limit) : documents;

  return {
    documents: isNewer ? page : page.reverse(),
    hasMore,
  };
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
      return createError("Limita de imagini este invalidă.", 400);
    }

    const direction =
      url.searchParams.get("direction")?.trim().toLowerCase() || "";
    const rawCursor = url.searchParams.get("cursor") || "";
    const cursor = decodeCursor(rawCursor);
    const anchorMessageId =
      url.searchParams.get("anchorMessageId")?.trim() || "";

    if (direction && !VALID_DIRECTIONS.has(direction)) {
      return createError("Direcția de paginare este invalidă.", 400);
    }

    if ((direction || rawCursor) && (!direction || !cursor)) {
      return createError("Cursorul imaginilor este invalid.", 400);
    }

    if (anchorMessageId && !ObjectId.isValid(anchorMessageId)) {
      return createError("Mesajul de pornire este invalid.", 400);
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

    const messagesCollection = await getMessagesCollection();
    const baseFilter = createMediaFilter(
      conversationObjectId,
      currentUserId
    );

    let documents = [];
    let hasOlder = false;
    let hasNewer = false;

    if (direction && cursor) {
      const page = await findPage({
        messagesCollection,
        baseFilter,
        cursor,
        direction,
        limit: pageSize,
      });

      documents = page.documents;
      hasOlder = direction === "older" ? page.hasMore : true;
      hasNewer = direction === "newer" ? page.hasMore : true;
    } else if (anchorMessageId) {
      const anchorMessage = await messagesCollection.findOne(
        {
          ...baseFilter,
          _id: new ObjectId(anchorMessageId),
        },
        {
          projection: {
            _id: 1,
            createdAt: 1,
          },
        }
      );

      if (!anchorMessage?.createdAt) {
        return createError(
          "Imaginea de pornire nu mai este disponibilă.",
          404
        );
      }

      const anchorCursor = {
        createdAt: anchorMessage.createdAt,
        id: anchorMessage._id,
      };
      const olderLimit = Math.ceil(pageSize / 2);
      const newerLimit = Math.floor(pageSize / 2);
      const [olderPage, newerPage] = await Promise.all([
        findPage({
          messagesCollection,
          baseFilter,
          cursor: anchorCursor,
          direction: "older",
          limit: olderLimit,
          includeBoundary: true,
        }),
        newerLimit > 0
          ? findPage({
              messagesCollection,
              baseFilter,
              cursor: anchorCursor,
              direction: "newer",
              limit: newerLimit,
            })
          : Promise.resolve({
              documents: [],
              hasMore: false,
            }),
      ]);

      documents = [
        ...olderPage.documents,
        ...newerPage.documents,
      ];
      hasOlder = olderPage.hasMore;
      hasNewer = newerPage.hasMore;
    } else {
      const recentDocuments = await messagesCollection
        .find(baseFilter, {
          projection: {
            _id: 1,
            senderId: 1,
            images: 1,
            createdAt: 1,
          },
        })
        .sort({
          createdAt: -1,
          _id: -1,
        })
        .limit(pageSize + 1)
        .toArray();
      hasOlder = recentDocuments.length > pageSize;
      documents = (hasOlder
        ? recentDocuments.slice(0, pageSize)
        : recentDocuments
      ).reverse();
    }

    const oldestDocument = documents[0] || null;
    const newestDocument = documents[documents.length - 1] || null;

    return NextResponse.json(
      {
        success: true,
        conversationId,
        media: serializeMediaItems(documents),
        pagination: {
          hasOlder,
          hasNewer,
          olderCursor: encodeCursor(oldestDocument),
          newerCursor: encodeCursor(newestDocument),
          limit: pageSize,
        },
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "GET /api/conversations/[id]/messages/media error:",
      error
    );

    return createError(
      "Imaginile conversației nu au putut fi încărcate.",
      500
    );
  }
}
