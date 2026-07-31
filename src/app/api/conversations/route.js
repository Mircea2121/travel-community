import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getCurrentUser } from "@/app/utils/currentUser";
import {
  getConversationsCollection,
  getUsersCollection,
  getMessagesCollection,
} from "@/app/utils/database";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          message: "Trebuie să fii autentificat.",
        },
        {
          status: 401,
        }
      );
    }

    const conversationsCollection =
      await getConversationsCollection();

    const usersCollection = await getUsersCollection();
    const messagesCollection = await getMessagesCollection();

    const conversations = await conversationsCollection
      .find({
        participants: currentUser._id,
      })
      .sort({
        lastMessageAt: -1,
        updatedAt: -1,
      })
      .toArray();

    const formattedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const otherParticipantId = conversation.participants?.find(
          (participantId) =>
            participantId.toString() !== currentUser._id.toString()
        );

        if (!otherParticipantId) {
          return null;
        }

        const otherUser = await usersCollection.findOne(
          {
            _id: new ObjectId(otherParticipantId),
          },
          {
            projection: {
              name: 1,
              username: 1,
              avatar: 1,
            },
          }
        );

        if (!otherUser) {
          return null;
        }

        const unreadCount = await messagesCollection.countDocuments({
          conversationId: conversation._id,
          senderId: {
            $ne: currentUser._id,
          },
          isRead: false,
        });

        return {
          _id: conversation._id.toString(),

          otherUser: {
            _id: otherUser._id.toString(),
            name: otherUser.name || "",
            username: otherUser.username || "",
            avatar: otherUser.avatar || "",
          },

          lastMessage: conversation.lastMessage || "",

          lastMessageSenderId:
            conversation.lastMessageSenderId?.toString() || null,

          lastMessageAt: conversation.lastMessageAt || null,

          unreadCount,

          createdAt: conversation.createdAt || null,

          updatedAt: conversation.updatedAt || null,
        };
      })
    );

    return NextResponse.json({
      currentUserId: currentUser._id.toString(),
      conversations: formattedConversations.filter(Boolean),
    });
  } catch (error) {
    console.error("GET /api/conversations error:", error);

    return NextResponse.json(
      {
        message: "Conversațiile nu au putut fi încărcate.",
      },
      {
        status: 500,
      }
    );
  }
}