import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getCurrentUser } from "@/app/utils/currentUser";
import {
  getConversationsCollection,
  getMessagesCollection,
} from "@/app/utils/database";

function createError(message, status) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );
}

export async function POST(request, { params }) {
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
      return createError("Datele confirmării de citire nu sunt valide.", 400);
    }

    const messageId =
      typeof body?.messageId === "string"
        ? body.messageId.trim()
        : "";

    if (!ObjectId.isValid(messageId)) {
      return createError("Mesajul văzut este invalid.", 400);
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
      return createError(
        "Conversația nu există sau nu ai acces la ea.",
        404
      );
    }

    const messagesCollection = await getMessagesCollection();

    const lastSeenMessage = await messagesCollection.findOne(
      {
        _id: messageObjectId,
        conversationId: conversationObjectId,
        senderId: {
          $ne: currentUserId,
        },
        deletedFor: {
          $ne: currentUserId,
        },
      },
      {
        projection: {
          _id: 1,
          createdAt: 1,
        },
      }
    );

    if (!lastSeenMessage?.createdAt) {
      return createError(
        "Mesajul nu există sau nu poate fi marcat drept citit.",
        404
      );
    }

    const seenAt = new Date();

    const updateResult = await messagesCollection.updateMany(
      {
        conversationId: conversationObjectId,
        senderId: {
          $ne: currentUserId,
        },
        createdAt: {
          $lte: lastSeenMessage.createdAt,
        },
        deletedFor: {
          $ne: currentUserId,
        },
        seenBy: {
          $not: {
            $elemMatch: {
              userId: currentUserId,
            },
          },
        },
      },
      [
        {
          $set: {
            seenBy: {
              $concatArrays: [
                {
                  $cond: [
                    {
                      $isArray: "$seenBy",
                    },
                    "$seenBy",
                    [],
                  ],
                },
                [
                  {
                    userId: currentUserId,
                    seenAt,
                  },
                ],
              ],
            },
            isRead: true,
          },
        },
      ]
    );

    return NextResponse.json({
      success: true,
      seen: {
        conversationId,
        userId: currentUserId.toString(),
        messageId: lastSeenMessage._id.toString(),
        seenAt: seenAt.toISOString(),
        updatedCount: updateResult.modifiedCount,
      },
    });
  } catch (error) {
    console.error(
      "POST /api/conversations/[id]/messages/seen error:",
      error
    );

    return createError(
      "Mesajele nu au putut fi marcate drept citite.",
      500
    );
  }
}
