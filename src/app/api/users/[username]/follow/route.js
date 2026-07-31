import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

import { getCurrentUser } from "../../../../utils/currentUser";
import { getUsersCollection } from "../../../../utils/database";

function jsonResponse(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function normalizeUsername(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
}

function getValidObjectId(value) {
  const normalizedValue = String(value || "");

  if (!ObjectId.isValid(normalizedValue)) {
    return null;
  }

  return new ObjectId(normalizedValue);
}

async function getFollowUsers(rawUsername) {
  const username = normalizeUsername(rawUsername);

  if (!username) {
    return {
      error: jsonResponse(
        {
          success: false,
          message: "Username-ul este obligatoriu.",
        },
        400
      ),
    };
  }

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      error: jsonResponse(
        {
          success: false,
          message:
            "Trebuie să fii autentificat pentru a urmări un utilizator.",
        },
        401
      ),
    };
  }

  const currentUserId = getValidObjectId(
    currentUser._id
  );

  if (!currentUserId) {
    return {
      error: jsonResponse(
        {
          success: false,
          message:
            "Utilizatorul autentificat nu este valid.",
        },
        401
      ),
    };
  }

  const usersCollection =
    await getUsersCollection();

  const profileUser =
    await usersCollection.findOne(
      {
        username,
      },
      {
        projection: {
          _id: 1,
          username: 1,
          followers: 1,
          following: 1,
        },
      }
    );

  if (!profileUser) {
    return {
      error: jsonResponse(
        {
          success: false,
          message:
            "Utilizatorul pe care încerci să îl urmărești nu a fost găsit.",
        },
        404
      ),
    };
  }

  const profileUserId = getValidObjectId(
    profileUser._id
  );

  if (!profileUserId) {
    return {
      error: jsonResponse(
        {
          success: false,
          message:
            "Profilul utilizatorului nu este valid.",
        },
        400
      ),
    };
  }

  if (
    currentUserId.toString() ===
    profileUserId.toString()
  ) {
    return {
      error: jsonResponse(
        {
          success: false,
          message:
            "Nu îți poți urmări propriul profil.",
        },
        400
      ),
    };
  }

  return {
    currentUserId,
    profileUserId,
    profileUser,
    usersCollection,
  };
}

export async function POST(
  request,
  { params }
) {
  try {
    const { username } = await params;

    const result =
      await getFollowUsers(username);

    if (result.error) {
      return result.error;
    }

    const {
      currentUserId,
      profileUserId,
      usersCollection,
    } = result;

    const alreadyFollowing =
      await usersCollection.findOne(
        {
          _id: currentUserId,
          following: profileUserId,
        },
        {
          projection: {
            _id: 1,
          },
        }
      );

    if (alreadyFollowing) {
      const [
        followersCount,
        followingCount,
      ] = await Promise.all([
        usersCollection.countDocuments({
          _id: profileUserId,
          followers: currentUserId,
        }),

        usersCollection.countDocuments({
          _id: currentUserId,
          following: profileUserId,
        }),
      ]);

      return jsonResponse({
        success: true,
        isFollowing: true,
        followersCount:
          followersCount > 0
            ? Array.isArray(
                (
                  await usersCollection.findOne(
                    {
                      _id: profileUserId,
                    },
                    {
                      projection: {
                        followers: 1,
                      },
                    }
                  )
                )?.followers
              )
              ? (
                  await usersCollection.findOne(
                    {
                      _id: profileUserId,
                    },
                    {
                      projection: {
                        followers: 1,
                      },
                    }
                  )
                ).followers.length
              : 0
            : 0,
        followingCount:
          followingCount > 0
            ? Array.isArray(
                (
                  await usersCollection.findOne(
                    {
                      _id: currentUserId,
                    },
                    {
                      projection: {
                        following: 1,
                      },
                    }
                  )
                )?.following
              )
              ? (
                  await usersCollection.findOne(
                    {
                      _id: currentUserId,
                    },
                    {
                      projection: {
                        following: 1,
                      },
                    }
                  )
                ).following.length
              : 0
            : 0,
        message:
          "Urmărești deja acest utilizator.",
      });
    }

    const now = new Date();

    const profileUpdate =
      await usersCollection.updateOne(
        {
          _id: profileUserId,
        },
        {
          $addToSet: {
            followers: currentUserId,
          },
          $set: {
            updatedAt: now,
          },
        }
      );

    if (profileUpdate.matchedCount === 0) {
      return jsonResponse(
        {
          success: false,
          message:
            "Profilul utilizatorului nu a fost găsit.",
        },
        404
      );
    }

    const currentUserUpdate =
      await usersCollection.updateOne(
        {
          _id: currentUserId,
        },
        {
          $addToSet: {
            following: profileUserId,
          },
          $set: {
            updatedAt: now,
          },
        }
      );

    if (currentUserUpdate.matchedCount === 0) {
      await usersCollection.updateOne(
        {
          _id: profileUserId,
        },
        {
          $pull: {
            followers: currentUserId,
          },
        }
      );

      return jsonResponse(
        {
          success: false,
          message:
            "Lista utilizatorilor urmăriți nu a putut fi actualizată.",
        },
        500
      );
    }

    const [
      updatedProfileUser,
      updatedCurrentUser,
    ] = await Promise.all([
      usersCollection.findOne(
        {
          _id: profileUserId,
        },
        {
          projection: {
            followers: 1,
          },
        }
      ),

      usersCollection.findOne(
        {
          _id: currentUserId,
        },
        {
          projection: {
            following: 1,
          },
        }
      ),
    ]);

    return jsonResponse({
      success: true,
      isFollowing: true,

      followersCount: Array.isArray(
        updatedProfileUser?.followers
      )
        ? updatedProfileUser.followers.length
        : 0,

      followingCount: Array.isArray(
        updatedCurrentUser?.following
      )
        ? updatedCurrentUser.following.length
        : 0,

      message:
        "Acum urmărești acest utilizator.",
    });
  } catch (error) {
    console.error(
      "Eroare la urmărirea utilizatorului:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message:
          "Utilizatorul nu a putut fi urmărit.",
      },
      500
    );
  }
}

export async function DELETE(
  request,
  { params }
) {
  try {
    const { username } = await params;

    const result =
      await getFollowUsers(username);

    if (result.error) {
      return result.error;
    }

    const {
      currentUserId,
      profileUserId,
      usersCollection,
    } = result;

    const now = new Date();

    await Promise.all([
      usersCollection.updateOne(
        {
          _id: profileUserId,
        },
        {
          $pull: {
            followers: currentUserId,
          },
          $set: {
            updatedAt: now,
          },
        }
      ),

      usersCollection.updateOne(
        {
          _id: currentUserId,
        },
        {
          $pull: {
            following: profileUserId,
          },
          $set: {
            updatedAt: now,
          },
        }
      ),
    ]);

    const [
      updatedProfileUser,
      updatedCurrentUser,
    ] = await Promise.all([
      usersCollection.findOne(
        {
          _id: profileUserId,
        },
        {
          projection: {
            followers: 1,
          },
        }
      ),

      usersCollection.findOne(
        {
          _id: currentUserId,
        },
        {
          projection: {
            following: 1,
          },
        }
      ),
    ]);

    return jsonResponse({
      success: true,
      isFollowing: false,

      followersCount: Array.isArray(
        updatedProfileUser?.followers
      )
        ? updatedProfileUser.followers.length
        : 0,

      followingCount: Array.isArray(
        updatedCurrentUser?.following
      )
        ? updatedCurrentUser.following.length
        : 0,

      message:
        "Nu mai urmărești acest utilizator.",
    });
  } catch (error) {
    console.error(
      "Eroare la oprirea urmăririi utilizatorului:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message:
          "Urmărirea utilizatorului nu a putut fi oprită.",
      },
      500
    );
  }
}