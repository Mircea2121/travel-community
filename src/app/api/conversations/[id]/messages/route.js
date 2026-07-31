import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getCurrentUser } from "@/app/utils/currentUser";
import {
  getConversationsCollection,
  getMessagesCollection,
} from "@/app/utils/database";

const MESSAGES_LIMIT = 100;

export async function GET(request, { params }) {
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

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          message: "Conversație invalidă.",
        },
        {
          status: 400,
        }
      );
    }

    const conversationId = new ObjectId(id);

    const conversationsCollection =
      await getConversationsCollection();

    const conversation =
      await conversationsCollection.findOne({
        _id: conversationId,
        participants: currentUser._id,
      });

    if (!conversation) {
      return NextResponse.json(
        {
          message: "Conversația nu există sau nu ai acces la ea.",
        },
        {
          status: 404,
        }
      );
    }

    const messagesCollection = await getMessagesCollection();

    const newestMessages = await messagesCollection
      .find({
        conversationId,
      })
      .sort({
        createdAt: -1,
      })
      .limit(MESSAGES_LIMIT)
      .toArray();

    const messages = newestMessages.reverse().map((message) => ({
      _id: message._id.toString(),

      conversationId: message.conversationId.toString(),

      senderId: message.senderId.toString(),

      text: message.text,

      isRead: Boolean(message.isRead),

      createdAt: message.createdAt,
    }));

    await messagesCollection.updateMany(
      {
        conversationId,
        senderId: {
          $ne: currentUser._id,
        },
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      conversationId: conversationId.toString(),
      currentUserId: currentUser._id.toString(),
      messages,
    });
  } catch (error) {
    console.error(
      "GET /api/conversations/[id]/messages error:",
      error
    );

    return NextResponse.json(
      {
        message: "Mesajele nu au putut fi încărcate.",
      },
      {
        status: 500,
      }
    );
  }
}