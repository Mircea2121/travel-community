import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getCurrentUser } from "@/app/utils/currentUser";
import {
  getConversationsCollection,
  getMessagesCollection,
} from "@/app/utils/database";

const MESSAGE_MAX_LENGTH = 2000;

export async function POST(request, { params }) {
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

    const body = await request.json();
    const text =
      typeof body?.text === "string" ? body.text.trim() : "";

    if (!text) {
      return NextResponse.json(
        {
          message: "Mesajul nu poate fi gol.",
        },
        {
          status: 400,
        }
      );
    }

    if (text.length > MESSAGE_MAX_LENGTH) {
      return NextResponse.json(
        {
          message: `Mesajul poate avea maximum ${MESSAGE_MAX_LENGTH} de caractere.`,
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
    const now = new Date();

    const messageDocument = {
      conversationId,
      senderId: currentUser._id,
      text,
      isRead: false,
      createdAt: now,
      updatedAt: now,
    };

    const result =
      await messagesCollection.insertOne(messageDocument);

    await conversationsCollection.updateOne(
      {
        _id: conversationId,
      },
      {
        $set: {
          lastMessage: text,
          lastMessageSenderId: currentUser._id,
          lastMessageAt: now,
          updatedAt: now,
        },
      }
    );

    return NextResponse.json(
      {
        message: {
          _id: result.insertedId.toString(),
          conversationId: conversationId.toString(),
          senderId: currentUser._id.toString(),
          text,
          isRead: false,
          createdAt: now,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/conversations/[id]/messages/send error:",
      error
    );

    return NextResponse.json(
      {
        message: "Mesajul nu a putut fi trimis.",
      },
      {
        status: 500,
      }
    );
  }
}