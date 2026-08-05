import { NextResponse } from "next/server";

import { getCurrentUser } from "@/app/utils/currentUser";
import { getUsersCollection } from "@/app/utils/database";

export async function POST() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {},
        {
          status: 401,
        }
      );
    }

    const usersCollection =
      await getUsersCollection();

    await usersCollection.updateOne(
      {
        _id: currentUser._id,
      },
      {
        $set: {
          isOnline: false,
          lastSeenAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {},
      {
        status: 500,
      }
    );
  }
}