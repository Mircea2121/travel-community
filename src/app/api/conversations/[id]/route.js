import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getCurrentUser } from "@/app/utils/currentUser";
import { getConversationsCollection } from "@/app/utils/database";

function createError(message, status) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );
}

export async function DELETE(request, { params }) {
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

    const currentUserId =
      currentUser._id instanceof ObjectId
        ? currentUser._id
        : new ObjectId(String(currentUser._id));

    const conversationsCollection =
      await getConversationsCollection();

    const result = await conversationsCollection.updateOne(
      {
        _id: new ObjectId(conversationId),
        participants: currentUserId,
      },
      {
        $addToSet: {
          hiddenFor: currentUserId,
        },
        $set: {
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount !== 1) {
      return createError(
        "Conversația nu există sau nu ai acces la ea.",
        404
      );
    }

    return NextResponse.json({
      success: true,
      message: "Conversația a fost ștearsă.",
    });
  } catch (error) {
    console.error(
      "DELETE /api/conversations/[id] error:",
      error
    );

    return createError(
      "Conversația nu a putut fi ștearsă.",
      500
    );
  }
}
