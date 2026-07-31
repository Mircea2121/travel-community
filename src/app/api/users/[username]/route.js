import { NextResponse } from "next/server";

import { getCurrentUser } from "../../../utils/currentUser";
import { getUsersCollection } from "../../../utils/database";
import { getPublicUser } from "../../../utils/publicUser";

function createResponse(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control":
        "no-store, no-cache, must-revalidate",
    },
  });
}

function normalizeUsername(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .toLowerCase();
}

function normalizeId(value) {
  if (!value) {
    return "";
  }

  return value.toString();
}

export async function GET(
  request,
  { params }
) {
  try {
    const {
      username: rawUsername,
    } = await params;

    const username =
      normalizeUsername(rawUsername);

    if (!username) {
      return createResponse(
        {
          success: false,
          message:
            "Username-ul este obligatoriu.",
        },
        400
      );
    }

    const usersCollection =
      await getUsersCollection();

    const profileUser =
      await usersCollection.findOne({
        username,
      });

    if (!profileUser) {
      return createResponse(
        {
          success: false,
          message:
            "Utilizatorul nu a fost găsit.",
        },
        404
      );
    }

    const currentUser =
      await getCurrentUser();

    const currentUserId =
      normalizeId(currentUser?._id);

    const profileUserId =
      normalizeId(profileUser?._id);

    const isOwnProfile =
      Boolean(currentUserId) &&
      Boolean(profileUserId) &&
      currentUserId === profileUserId;

    const followers = Array.isArray(
      profileUser.followers
    )
      ? profileUser.followers
      : [];

    const following = Array.isArray(
      profileUser.following
    )
      ? profileUser.following
      : [];

    const isFollowing =
      !isOwnProfile &&
      Boolean(currentUserId) &&
      followers.some(
        (followerId) =>
          normalizeId(followerId) ===
          currentUserId
      );

    const publicUser =
      await getPublicUser(
        profileUser
      );

    const followersCount =
      Number(
        publicUser?.stats
          ?.followersCount
      ) || followers.length;

    const followingCount =
      Number(
        publicUser?.stats
          ?.followingCount
      ) || following.length;

    return createResponse({
      success: true,

      user: {
        ...publicUser,

        stats: {
          ...(publicUser?.stats ||
            {}),

          followersCount,
          followingCount,
        },

        isOwnProfile,
        isFollowing,
      },

      isOwnProfile,
      isFollowing,
      followersCount,
      followingCount,
    });
  } catch (error) {
    console.error(
      "Eroare la citirea profilului public:",
      error
    );

    return createResponse(
      {
        success: false,
        message:
          "A apărut o eroare la încărcarea profilului.",
      },
      500
    );
  }
}