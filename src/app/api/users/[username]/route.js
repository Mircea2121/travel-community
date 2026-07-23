import { NextResponse } from "next/server";

import { getCurrentUser } from "../../../utils/currentUser";
import { getUsersCollection } from "../../../utils/database";
import { getPublicUser } from "../../../utils/publicUser";

export async function GET(request, { params }) {
  try {
    const { username: rawUsername } = await params;

    const username = rawUsername?.trim().toLowerCase();

    if (!username) {
      return NextResponse.json(
        {
          success: false,
          message: "Username-ul este obligatoriu.",
        },
        {
          status: 400,
        }
      );
    }

    const usersCollection = await getUsersCollection();

    const profileUser = await usersCollection.findOne({
      username,
    });

    if (!profileUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Utilizatorul nu a fost găsit.",
        },
        {
          status: 404,
        }
      );
    }

    const currentUser = await getCurrentUser();

    const isOwnProfile =
      currentUser?._id.toString() === profileUser._id.toString();

    const isFollowing = currentUser
      ? profileUser.followers?.some(
          (followerId) =>
            followerId.toString() === currentUser._id.toString()
        ) ?? false
      : false;

    return NextResponse.json({
      success: true,
      user: getPublicUser(profileUser),
      isOwnProfile,
      isFollowing,
    });
  } catch (error) {
    console.error("Eroare la citirea profilului public:", error);

    return NextResponse.json(
      {
        success: false,
        message: "A apărut o eroare la încărcarea profilului.",
      },
      {
        status: 500,
      }
    );
  }
}