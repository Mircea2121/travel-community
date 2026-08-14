import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getCurrentUser } from "@/app/utils/currentUser";
import { getMessagesCollection } from "@/app/utils/database";

export const runtime = "nodejs";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?._id) {
      return NextResponse.json(
        { success: false, message: "Trebuie să fii autentificat." },
        { status: 401 }
      );
    }

    const currentUserId =
      currentUser._id instanceof ObjectId
        ? currentUser._id
        : new ObjectId(String(currentUser._id));
    const messagesCollection = await getMessagesCollection();
    const [result] = await messagesCollection
      .aggregate([
        {
          $match: {
            senderId: { $ne: currentUserId },
            isRead: false,
            isDeleted: { $ne: true },
            deletedFor: { $ne: currentUserId },
          },
        },
        {
          $lookup: {
            from: "conversations",
            let: { conversationId: "$conversationId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$_id", "$$conversationId"] },
                      { $in: [currentUserId, "$participants"] },
                    ],
                  },
                },
              },
              { $project: { _id: 1 } },
            ],
            as: "conversation",
          },
        },
        { $match: { "conversation.0": { $exists: true } } },
        { $count: "count" },
      ])
      .toArray();
    const unreadCount = Number(result?.count || 0);

    return NextResponse.json(
      { success: true, unreadCount },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("GET /api/conversations/unread-count error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Notificările nu au putut fi încărcate.",
      },
      { status: 500 }
    );
  }
}
