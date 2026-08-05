import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getCurrentUser } from "@/app/utils/currentUser";
import { getConversationsCollection } from "@/app/utils/database";
import { getPresenceState } from "@/app/utils/presence";

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

function serializeDate(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date.toISOString();
}

function serializeAvatar(avatar) {
  if (typeof avatar === "string") {
    return {
      url: avatar.trim(),
      publicId: "",
    };
  }

  if (!avatar || typeof avatar !== "object") {
    return {
      url: "",
      publicId: "",
    };
  }

  return {
    url:
      typeof avatar.url === "string"
        ? avatar.url.trim()
        : "",
    publicId:
      typeof avatar.publicId === "string"
        ? avatar.publicId.trim()
        : "",
  };
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

function encodeCursor(conversation) {
  if (!conversation?._id || !conversation?.sortAt) {
    return null;
  }

  const sortAt = new Date(conversation.sortAt);

  if (Number.isNaN(sortAt.getTime())) {
    return null;
  }

  return Buffer.from(
    JSON.stringify({
      sortAt: sortAt.toISOString(),
      id: conversation._id.toString(),
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
      typeof decoded.sortAt !== "string" ||
      typeof decoded.id !== "string" ||
      !ObjectId.isValid(decoded.id)
    ) {
      return null;
    }

    const sortAt = new Date(decoded.sortAt);

    if (Number.isNaN(sortAt.getTime())) {
      return null;
    }

    return {
      sortAt,
      id: new ObjectId(decoded.id),
    };
  } catch {
    return null;
  }
}

function createCursorStage(cursor) {
  if (!cursor) {
    return [];
  }

  return [
    {
      $match: {
        $or: [
          {
            sortAt: {
              $lt: cursor.sortAt,
            },
          },
          {
            sortAt: cursor.sortAt,
            _id: {
              $lt: cursor.id,
            },
          },
        ],
      },
    },
  ];
}

export async function GET(request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?._id) {
      return createError(
        "Trebuie să fii autentificat pentru a vedea conversațiile.",
        401
      );
    }

    const url = new URL(request.url);
    const pageSize = getPageSize(url.searchParams);

    if (pageSize === null) {
      return createError("Limita de conversații este invalidă.", 400);
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

    const conversationsCollection =
      await getConversationsCollection();

    const conversations = await conversationsCollection
      .aggregate([
        {
          $match: {
            participants: currentUserId,
            hiddenFor: {
              $ne: currentUserId,
            },
          },
        },
        {
          $set: {
            otherParticipantId: {
              $first: {
                $filter: {
                  input: {
                    $cond: [
                      {
                        $isArray: "$participants",
                      },
                      "$participants",
                      [],
                    ],
                  },
                  as: "participantId",
                  cond: {
                    $ne: ["$$participantId", currentUserId],
                  },
                },
              },
            },
          },
        },
        {
          $lookup: {
            from: "messages",
            let: {
              conversationId: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: [
                      "$conversationId",
                      "$$conversationId",
                    ],
                  },
                  deletedFor: {
                    $ne: currentUserId,
                  },
                },
              },
              {
                $sort: {
                  createdAt: -1,
                  _id: -1,
                },
              },
              {
                $limit: 1,
              },
              {
                $project: {
                  senderId: 1,
                  text: 1,
                  images: 1,
                  messageType: 1,
                  isDeleted: 1,
                  createdAt: 1,
                },
              },
            ],
            as: "visibleLastMessages",
          },
        },
        {
          $set: {
            visibleLastMessage: {
              $first: "$visibleLastMessages",
            },
          },
        },
        {
          $set: {
            sortAt: {
              $ifNull: [
                "$visibleLastMessage.createdAt",
                {
                  $ifNull: ["$updatedAt", "$createdAt"],
                },
              ],
            },
          },
        },
        ...createCursorStage(cursor),
        {
          $sort: {
            sortAt: -1,
            _id: -1,
          },
        },
        {
          $limit: pageSize + 1,
        },
        {
          $lookup: {
            from: "users",
            localField: "otherParticipantId",
            foreignField: "_id",
            as: "otherUsers",
            pipeline: [
              {
                $project: {
                  name: 1,
                  fullName: 1,
                  username: 1,
                  avatar: 1,
                  lastSeenAt: 1,
                },
              },
            ],
          },
        },
        {
          $set: {
            otherUser: {
              $first: "$otherUsers",
            },
          },
        },
        {
          $lookup: {
            from: "messages",
            let: {
              conversationId: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $eq: [
                          "$conversationId",
                          "$$conversationId",
                        ],
                      },
                      {
                        $ne: ["$senderId", currentUserId],
                      },
                    ],
                  },
                  isRead: false,
                  isDeleted: {
                    $ne: true,
                  },
                  deletedFor: {
                    $ne: currentUserId,
                  },
                },
              },
              {
                $count: "count",
              },
            ],
            as: "unread",
          },
        },
        {
          $set: {
            unreadCount: {
              $ifNull: [
                {
                  $first: "$unread.count",
                },
                0,
              ],
            },
          },
        },
        {
          $unset: [
            "otherUsers",
            "unread",
            "visibleLastMessages",
          ],
        },
      ])
      .toArray();

    const hasMore = conversations.length > pageSize;
    const pageConversations = hasMore
      ? conversations.slice(0, pageSize)
      : conversations;

    const lastConversation =
      pageConversations[pageConversations.length - 1] || null;
    const now = new Date();

    const formattedConversations = pageConversations
      .filter((conversation) => conversation.otherUser?._id)
      .map((conversation) => {
        const avatar = serializeAvatar(
          conversation.otherUser.avatar
        );
        const presence = getPresenceState(
          conversation.otherUser.lastSeenAt,
          now
        );

        return {
          _id: conversation._id.toString(),
          otherUser: {
            _id: conversation.otherUser._id.toString(),
            name:
              conversation.otherUser.name ||
              conversation.otherUser.fullName ||
              conversation.otherUser.username ||
              "Utilizator",
            username: conversation.otherUser.username || "",
            avatar: avatar.url,
            avatarData: avatar,
            ...presence,
          },
          lastMessage:
            conversation.visibleLastMessage?.isDeleted === true
              ? "Mesaj șters"
              : conversation.visibleLastMessage?.text ||
                (Array.isArray(
                  conversation.visibleLastMessage?.images
                ) &&
                conversation.visibleLastMessage.images.length > 0
                  ? conversation.visibleLastMessage.images.length === 1
                    ? "Imagine"
                    : `${conversation.visibleLastMessage.images.length} imagini`
                  : ""),
          lastMessageType:
            conversation.visibleLastMessage?.isDeleted === true
              ? "deleted"
              : conversation.visibleLastMessage?.messageType ||
                "text",
          lastMessageSenderId:
            conversation.visibleLastMessage?.senderId?.toString?.() ||
            null,
          lastMessageAt: serializeDate(
            conversation.visibleLastMessage?.createdAt
          ),
          unreadCount: Number(conversation.unreadCount || 0),
          createdAt: serializeDate(conversation.createdAt),
          updatedAt: serializeDate(conversation.updatedAt),
        };
      });

    return NextResponse.json(
      {
        success: true,
        currentUserId: currentUserId.toString(),
        conversations: formattedConversations,
        pagination: {
          hasMore,
          nextCursor: hasMore
            ? encodeCursor(lastConversation)
            : null,
          limit: pageSize,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/conversations error:", error);

    return createError(
      "Conversațiile nu au putut fi încărcate.",
      500
    );
  }
}
