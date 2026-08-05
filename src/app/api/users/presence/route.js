import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getCurrentUser } from "@/app/utils/currentUser";
import { getUsersCollection } from "@/app/utils/database";
import { getPresenceState } from "@/app/utils/presence";

function createError(message, status) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );
}

export async function POST() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser?._id) {
      return createError("Trebuie să fii autentificat.", 401);
    }

    const currentUserId =
      currentUser._id instanceof ObjectId
        ? currentUser._id
        : new ObjectId(String(currentUser._id));

    const usersCollection = await getUsersCollection();
    const now = new Date();

    const updateResult = await usersCollection.updateOne(
      {
        _id: currentUserId,
      },
      {
        $set: {
          isOnline: true,
          lastSeenAt: now,
        },
      }
    );

    if (updateResult.matchedCount !== 1) {
      return createError("Utilizatorul nu mai există.", 404);
    }

    return NextResponse.json(
      {
        success: true,
        presence: {
          userId: currentUserId.toString(),
          ...getPresenceState(now, now),
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("POST /api/users/presence error:", error);

    return createError(
      "Statusul online nu a putut fi actualizat.",
      500
    );
  }
}
