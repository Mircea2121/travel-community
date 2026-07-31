import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getCurrentUser } from "@/app/utils/currentUser";
import {
  getConversationsCollection,
  getUsersCollection,
} from "@/app/utils/database";

export async function POST(request) {
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

    const body = await request.json();
    const userId =
      typeof body?.userId === "string" ? body.userId.trim() : "";

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        {
          message: "Utilizator invalid.",
        },
        {
          status: 400,
        }
      );
    }

    const currentUserId = currentUser._id.toString();

    if (currentUserId === userId) {
      return NextResponse.json(
        {
          message: "Nu poți începe o conversație cu tine.",
        },
        {
          status: 400,
        }
      );
    }

    const usersCollection = await getUsersCollection();

    const otherUser = await usersCollection.findOne(
      {
        _id: new ObjectId(userId),
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
      return NextResponse.json(
        {
          message: "Utilizatorul nu există.",
        },
        {
          status: 404,
        }
      );
    }

    const conversationsCollection =
      await getConversationsCollection();

    const participantIds = [currentUserId, userId].sort();
    const conversationKey = participantIds.join(":");
    const now = new Date();

    const result = await conversationsCollection.findOneAndUpdate(
      {
        conversationKey,
      },
      {
        $setOnInsert: {
          conversationKey,
          participantIds,
          participants: participantIds.map(
            (participantId) => new ObjectId(participantId)
          ),
          lastMessage: "",
          lastMessageSenderId: null,
          lastMessageAt: null,
          createdAt: now,
          updatedAt: now,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    const conversation = result?.value ?? result;

    if (!conversation?._id) {
      return NextResponse.json(
        {
          message: "Conversația nu a putut fi creată.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        conversation: {
          _id: conversation._id.toString(),
          otherUser: {
            _id: otherUser._id.toString(),
            name: otherUser.name || "",
            username: otherUser.username || "",
            avatar: otherUser.avatar || "",
          },
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("POST /api/conversations/start error:", error);

    return NextResponse.json(
      {
        message: "Conversația nu a putut fi deschisă.",
      },
      {
        status: 500,
      }
    );
  }
}