import { ObjectId } from "mongodb";

import { getCurrentUser } from "../../../../../../../utils/currentUser";

import {
  getDatabase,
  getPostsCollection,
} from "../../../../../../../utils/database";

function getObjectId(value) {
  if (
    !value ||
    !ObjectId.isValid(value)
  ) {
    return null;
  }

  return new ObjectId(value);
}

function valuesMatch(
  firstValue,
  secondValue
) {
  if (
    !firstValue ||
    !secondValue
  ) {
    return false;
  }

  return (
    String(firstValue) ===
    String(secondValue)
  );
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
            "Trebuie să fii autentificat pentru a șterge un răspuns.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      id,
      commentId,
      replyId,
    } = await params;

    const postObjectId =
      getObjectId(id);

    const commentObjectId =
      getObjectId(commentId);

    const replyObjectId =
      getObjectId(replyId);

    const currentUserObjectId =
      getObjectId(
        String(
          currentUser?._id || ""
        )
      );

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

    if (!replyObjectId) {
      return Response.json(
        {
          success: false,
          message:
            "ID-ul răspunsului nu este valid.",
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
      database.collection(
        "comments"
      );

    const parentComment =
      await commentsCollection.findOne(
        {
          _id: commentObjectId,
          postId: postObjectId,
          parentCommentId: {
            $exists: false,
          },
        },
        {
          projection: {
            _id: 1,
          },
        }
      );

    if (!parentComment) {
      return Response.json(
        {
          success: false,
          message:
            "Comentariul părinte nu a fost găsit.",
        },
        {
          status: 404,
        }
      );
    }

    const reply =
      await commentsCollection.findOne({
        _id: replyObjectId,
        postId: postObjectId,
        parentCommentId:
          commentObjectId,
      });

    if (!reply) {
      return Response.json(
        {
          success: false,
          message:
            "Răspunsul nu a fost găsit.",
        },
        {
          status: 404,
        }
      );
    }

    const currentUserId =
      String(
        currentUserObjectId
      );

    const replyAuthorId =
      String(
        reply.userId || ""
      );

    const postAuthorId =
      String(
        post.authorId ||
          post.userId ||
          ""
      );

    const isReplyAuthor =
      valuesMatch(
        currentUserId,
        replyAuthorId
      );

    const isPostAuthor =
      valuesMatch(
        currentUserId,
        postAuthorId
      );

    const isAdmin =
      currentUser.role ===
      "admin";

    if (
      !isReplyAuthor &&
      !isPostAuthor &&
      !isAdmin
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Nu ai permisiunea să ștergi acest răspuns.",
        },
        {
          status: 403,
        }
      );
    }

    const deleteResult =
      await commentsCollection.deleteOne({
        _id: replyObjectId,
        postId: postObjectId,
        parentCommentId:
          commentObjectId,
      });

    if (
      deleteResult.deletedCount !== 1
    ) {
      return Response.json(
        {
          success: false,
          message:
            "Răspunsul nu a putut fi șters.",
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
                      1,
                    ],
                  },
                ],
              },
            },
          },
        ],
        {
          returnDocument:
            "after",

          projection: {
            commentsCount: 1,
          },
        }
      );

    const repliesCount =
      await commentsCollection.countDocuments(
        {
          postId:
            postObjectId,

          parentCommentId:
            commentObjectId,
        }
      );

    return Response.json({
      success: true,

      message:
        "Răspunsul a fost șters.",

      deletedReplyId:
        String(replyObjectId),

      parentCommentId:
        String(commentObjectId),

      repliesCount,

      commentsCount:
        typeof updatedPost?.commentsCount ===
        "number"
          ? updatedPost.commentsCount
          : Math.max(
              0,
              Number(
                post.commentsCount || 0
              ) - 1
            ),
    });
  } catch (error) {
    console.error(
      "Eroare la ștergerea răspunsului:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Răspunsul nu a putut fi șters.",
      },
      {
        status: 500,
      }
    );
  }
}