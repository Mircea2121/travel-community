import bcrypt from "bcryptjs";

import {
  clearAuthCookie,
  enforceAccountRateLimit,
  jsonResponse,
} from "../../../utils/accountSecurity";
import { deleteImage } from "../../../utils/cloudinary";
import { getCurrentUser } from "../../../utils/currentUser";
import clientPromise from "../../../utils/mongodb";

export const runtime = "nodejs";

const DATABASE_NAME =
  "travel-community";
const DELETE_CONFIRMATION =
  "STERGE CONTUL";

class AccountChangedError extends Error {}

function getPublicId(image) {
  return typeof image?.publicId ===
    "string"
    ? image.publicId.trim()
    : "";
}

export async function DELETE(request) {
  let session;

  try {
    const user = await getCurrentUser({
      includePassword: true,
    });

    if (!user?.password) {
      return jsonResponse(
        {
          success: false,
          message:
            "Sesiunea nu este validă sau a expirat.",
        },
        401
      );
    }

    const rateLimitResponse =
      await enforceAccountRateLimit({
        request,
        userId: user._id,
        action:
          "settings:delete-account",
        limit: 3,
        windowSeconds: 60 * 60,
      });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        {
          success: false,
          message:
            "Datele trimise nu sunt valide.",
        },
        400
      );
    }

    const password =
      typeof body?.password === "string"
        ? body.password
        : "";
    const confirmation =
      typeof body?.confirmation ===
      "string"
        ? body.confirmation
            .trim()
            .toLocaleUpperCase("ro-RO")
        : "";

    if (confirmation !== DELETE_CONFIRMATION) {
      return jsonResponse(
        {
          success: false,
          message:
            "Scrie exact «STERGE CONTUL» pentru confirmare.",
        },
        400
      );
    }

    const passwordIsValid =
      password &&
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordIsValid) {
      return jsonResponse(
        {
          success: false,
          message:
            "Parola actuală este incorectă.",
        },
        401
      );
    }

    const mediaPublicIds = [
      getPublicId(user.avatar),
      getPublicId(user.coverImage),
    ].filter(Boolean);

    const client = await clientPromise;
    const database = client.db(
      DATABASE_NAME
    );
    const userId = user._id;
    const userIdString =
      userId.toString();
    const now = new Date();

    session = client.startSession();

    await session.withTransaction(
      async () => {
        const usersCollection =
          database.collection("users");

        const userUpdateResult =
          await usersCollection.updateOne(
            {
              _id: userId,
              password: user.password,
              accountStatus: {
                $ne: "deleted",
              },
            },
            {
              $set: {
                name: "Utilizator șters",
                accountStatus: "deleted",
                deletedAt: now,
                updatedAt: now,
                followers: [],
                following: [],
                stats: {
                  postsCount: 0,
                  destinationsCount: 0,
                  likesReceived: 0,
                  followersCount: 0,
                  followingCount: 0,
                },
                mediaDeletionPending:
                  mediaPublicIds,
              },
              $inc: {
                authVersion: 1,
              },
              $unset: {
                email: "",
                username: "",
                password: "",
                passwordChangedAt: "",
                nameChangedAt: "",
                bio: "",
                location: "",
                city: "",
                country: "",
                avatar: "",
                coverImage: "",
                resetPasswordToken: "",
                resetPasswordExpiresAt: "",
              },
            },
            {
              session,
            }
          );

        if (
          userUpdateResult.matchedCount !== 1
        ) {
          throw new AccountChangedError();
        }

        await usersCollection.updateMany(
            {
              _id: {
                $ne: userId,
              },
            },
            {
              $pull: {
                followers: userId,
                following: userId,
              },
            },
            {
              session,
            }
          );

        await database
          .collection("savedPosts")
          .deleteMany(
              {
                userId,
              },
              {
              session,
            }
            );

        const userLikes = await database
          .collection("likes")
          .find(
            {
              userId,
            },
            {
              projection: {
                _id: 0,
                postId: 1,
              },
              session,
            }
          )
          .toArray();

        await database
          .collection("likes")
          .deleteMany(
              {
                userId,
              },
              {
              session,
            }
            );

        const likedPostIds = userLikes
          .map((like) => like.postId)
          .filter(Boolean);

        if (likedPostIds.length > 0) {
          await database
            .collection("posts")
            .updateMany(
              {
                _id: {
                  $in: likedPostIds,
                },
                likesCount: {
                  $gt: 0,
                },
              },
              {
                $inc: {
                  likesCount: -1,
                },
              },
              {
                session,
              }
            );
        }

        await database
          .collection(
            "passwordResetTokens"
          )
          .deleteMany(
              {
                userId,
              },
              {
                session,
              }
            );

        await database
          .collection("posts")
          .updateMany(
              {
                authorId: userId,
              },
              {
                $set: {
                  name:
                    "Utilizator șters",
                  username: "",
                  avatar: null,
                },
              },
              {
                session,
              }
            );

        await database
          .collection("comments")
          .updateMany(
              {
                userId,
              },
              {
                $set: {
                  name:
                    "Utilizator șters",
                  username: "",
                  avatar: null,
                },
              },
              {
                session,
              }
            );

        await database
          .collection("messages")
          .updateMany(
              {
                $or: [
                  {
                    "reactions.userId": {
                      $in: [
                        userId,
                        userIdString,
                      ],
                    },
                  },
                  {
                    "seenBy.userId": {
                      $in: [
                        userId,
                        userIdString,
                      ],
                    },
                  },
                  {
                    deletedFor: {
                      $in: [
                        userId,
                        userIdString,
                      ],
                    },
                  },
                ],
              },
              {
                $pull: {
                  reactions: {
                    userId: {
                      $in: [
                        userId,
                        userIdString,
                      ],
                    },
                  },
                  seenBy: {
                    userId: {
                      $in: [
                        userId,
                        userIdString,
                      ],
                    },
                  },
                  deletedFor: {
                    $in: [
                      userId,
                      userIdString,
                    ],
                  },
                },
              },
              {
                session,
              }
            );
      },
      {
        readConcern: {
          level: "snapshot",
        },
        writeConcern: {
          w: "majority",
        },
        readPreference: "primary",
      }
    );

    const deletionResults =
      await Promise.allSettled(
        mediaPublicIds.map((publicId) =>
          deleteImage(publicId)
        )
      );

    const failedMediaPublicIds =
      mediaPublicIds.filter(
        (_, index) =>
          deletionResults[index]?.status ===
          "rejected"
      );

    await database
      .collection("users")
      .updateOne(
        {
          _id: userId,
          accountStatus: "deleted",
        },
        failedMediaPublicIds.length > 0
          ? {
              $set: {
                mediaDeletionPending:
                  failedMediaPublicIds,
              },
            }
          : {
              $unset: {
                mediaDeletionPending: "",
              },
            }
      );

    await clearAuthCookie();

    return jsonResponse(
      {
        success: true,
        message:
          "Contul a fost șters, iar conținutul public a fost anonimizat.",
      },
      200
    );
  } catch (error) {
    if (error instanceof AccountChangedError) {
      return jsonResponse(
        {
          success: false,
          message:
            "Contul a fost modificat între timp. Reîncarcă pagina și încearcă din nou.",
        },
        409
      );
    }

    console.error(
      "Eroare la ștergerea contului:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message:
          "Contul nu a putut fi șters momentan.",
      },
      500
    );
  } finally {
    await session?.endSession();
  }
}
