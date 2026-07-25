import { ObjectId } from "mongodb";

import { getCurrentUser } from "../../../../../utils/currentUser";

import {
  getDatabase,
  getPostsCollection,
} from "../../../../../utils/database";

function getObjectId(value) {
  if (!value || !ObjectId.isValid(value)) {
    return null;
  }

  return new ObjectId(value);
}

function getCurrentUserId(currentUser) {
  return getObjectId(
    String(currentUser?._id || "")
  );
}

function valuesMatch(firstValue, secondValue) {
  if (!firstValue || !secondValue) {
    return false;
  }

  return String(firstValue) === String(secondValue);
}

export async function DELETE(
  request,
  { params }
) {
  try {
    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return Response.json(
        {
          success: false,
          message:
            "Trebuie să fii autentificat pentru a șterge un comentariu.",
        },
        {
          status: 401,
        }
      );
    }

    const { id, commentId } =
      await params;

    const postObjectId =
      getObjectId(id);

    const commentObjectId =
      getObjectId(commentId);

    const currentUserObjectId =
      getCurrentUserId(currentUser);

    if (!postObjectId) {
      return Response.json(
        {
          success: false,
          message:
            "ID-ul postării nu este valid.",
        },
        {
          status: 400,
        }
      );
    }

    if (!commentObjectId) {
      return Response.json(
        {
          success: false,
          message:
            "ID-ul comentariului nu este valid.",
        },
        {
          status: 400,
        }
      );
    }

    if (!currentUserObjectId) {
      return Response.json(
        {
          success: false,
          message:
            "Utilizatorul autentificat nu este valid.",
        },
        {
          status: 401,
        }
      );
    }

    const postsCollection =
      await getPostsCollection();

    const post =
      await postsCollection.findOne(
        {
          _id: postObjectId,
        },
        {
          projection: {
            _id: 1,
            userId: 1,
            authorId: 1,
            commentsCount: 1,
          },
        }
      );

    if (!post) {
      return Response.json(
        {
          success: false,
          message:
            "Postarea nu a fost găsită.",
        },
        {
          status: 404,
        }
      );
    }

    const database =
      await getDatabase();

    const commentsCollection =
      database.collection("comments");

    const comment =
      await commentsCollection.findOne({
        _id: commentObjectId,
        postId: postObjectId,
        parentCommentId: {
          $exists: false,
        },
      });

    if (!comment) {
      return Response.json(
        {
          success: false,
          message:
            "Comentariul nu a fost găsit.",
        },
        {
          status: 404,
        }
      );
    }

    const currentUserId =
      String(currentUserObjectId);

    const commentAuthorId =
      String(comment.userId || "");

    const postAuthorId =
      String(
        post.authorId ||
          post.userId ||
          ""
      );

    const isCommentAuthor =
      valuesMatch(
        currentUserId,
        commentAuthorId
      );

    const isPostAuthor =
      valuesMatch(
        currentUserId,
        postAuthorId
      );

    const isAdmin =
      currentUser.role === "admin";

    if (
      !isCommentAuthor &&
      !isPostAuthor &&
      !isAdmin
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Nu ai permisiunea să ștergi acest comentariu.",
        },
        {
          status: 403,
        }
      );
    }

    const repliesCount =
      await commentsCollection.countDocuments({
        postId: postObjectId,
        parentCommentId:
          commentObjectId,
      });

    const deletedItemsCount =
      repliesCount + 1;

    const deleteResult =
      await commentsCollection.deleteMany({
        postId: postObjectId,
        $or: [
          {
            _id: commentObjectId,
          },
          {
            parentCommentId:
              commentObjectId,
          },
        ],
      });

    if (
      deleteResult.deletedCount === 0
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Comentariul nu a putut fi șters.",
        },
        {
          status: 500,
        }
      );
    }

    const updatedPost =
      await postsCollection.findOneAndUpdate(
        {
          _id: postObjectId,
        },
        [
          {
            $set: {
              commentsCount: {
                $max: [
                  0,
                  {
                    $subtract: [
                      {
                        $ifNull: [
                          "$commentsCount",
                          0,
                        ],
                      },
                      deletedItemsCount,
                    ],
                  },
                ],
              },
            },
          },
        ],
        {
          returnDocument: "after",
          projection: {
            commentsCount: 1,
          },
        }
      );

    return Response.json({
      success: true,
      message:
        repliesCount > 0
          ? "Comentariul și răspunsurile sale au fost șterse."
          : "Comentariul a fost șters.",

      deletedCommentId:
        String(commentObjectId),

      deletedRepliesCount:
        repliesCount,

      commentsCount:
        typeof updatedPost?.commentsCount ===
        "number"
          ? updatedPost.commentsCount
          : Math.max(
              0,
              Number(
                post.commentsCount || 0
              ) - deletedItemsCount
            ),
    });
  } catch (error) {
    console.error(
      "Eroare la ștergerea comentariului:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Comentariul nu a putut fi șters.",
      },
      {
        status: 500,
      }
    );
  }
}