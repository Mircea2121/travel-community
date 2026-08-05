import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getCurrentUser } from "@/app/utils/currentUser";
import { getConversationsCollection } from "@/app/utils/database";
import {
  MESSAGE_IMAGES,
  deleteMessageImages,
} from "@/app/utils/uploadMessageImages";

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
      return createError("Datele imaginilor nu sunt valide.", 400);
    }

    if (!Array.isArray(body?.images)) {
      return createError("Imaginile trimise nu sunt valide.", 400);
    }

    if (body.images.length > MESSAGE_IMAGES.MAX_COUNT) {
      return createError(
        `Pot fi curățate maximum ${MESSAGE_IMAGES.MAX_COUNT} imagini simultan.`,
        400
      );
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

    const publicIdPrefix =
      `travel-community/messages/${conversationId}/${currentUserId}/`;
    const usedPublicIds = new Set();
    const images = [];

    for (const image of body.images) {
      const publicId =
        typeof image?.publicId === "string"
          ? image.publicId.trim()
          : "";

      if (!publicId || !publicId.startsWith(publicIdPrefix)) {
        return createError(
          "Una dintre imagini nu aparține acestei conversații.",
          403
        );
      }

      if (!usedPublicIds.has(publicId)) {
        usedPublicIds.add(publicId);
        images.push({ publicId });
      }
    }

    await deleteMessageImages(images);

    return NextResponse.json({
      success: true,
      processedCount: images.length,
    });
  } catch (error) {
    console.error(
      "POST /api/conversations/[id]/messages/upload/cleanup error:",
      error
    );

    return createError(
      "Imaginile temporare nu au putut fi curățate.",
      500
    );
  }
}
