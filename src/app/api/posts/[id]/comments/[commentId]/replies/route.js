import { ObjectId } from "mongodb";

import { getCurrentUser } from "../../../../../../utils/currentUser";

import {
  getDatabase,
  getPostsCollection,
} from "../../../../../../utils/database";

const MAX_REPLY_LENGTH = 1500;

let commentsIndexesPromise = null;

async function getCommentsCollection() {
  const database = await getDatabase();
  const commentsCollection =
    database.collection("comments");

  if (!commentsIndexesPromise) {
    commentsIndexesPromise = Promise.all([
      commentsCollection.createIndex(
        {
          postId: 1,
          parentCommentId: 1,
          createdAt: 1,
        },
        {
          name: "replies_by_parent_comment",
        }
      ),

      commentsCollection.createIndex(
        {
          userId: 1,
          createdAt: -1,
        },
        {
          name: "comments_by_user",
        }
      ),
    ]);
  }

  await commentsIndexesPromise;

  return commentsCollection;
}

function getObjectId(value) {
  if (!value || !ObjectId.isValid(value)) {
    return null;
  }

  return new ObjectId(value);
}

function getUserObjectId(currentUser) {
  const userId = String(
    currentUser?._id || ""
  );

  return getObjectId(userId);
}

function serializeReply(reply) {
  return {
    ...reply,
    _id: String(reply._id),
    postId: String(reply.postId),
    userId: String(reply.userId),
    parentCommentId: String(
      reply.parentCommentId
    ),
  };
}

export async function GET(
  request,
  { params }
) {
  try {
    const { id, commentId } =
      await params;

    const postObjectId =
      getObjectId(id);

    const commentObjectId =
      getObjectId(commentId);

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

    const commentsCollection =
      await getCommentsCollection();

    const parentComment =
      await commentsCollection.findOne({
        _id: commentObjectId,
        postId: postObjectId,
        parentCommentId: {
          $exists: false,
        },
      });

    if (!parentComment) {
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

    const replies =
      await commentsCollection
        .find({
          postId: postObjectId,
          parentCommentId:
            commentObjectId,
        })
        .sort({
          createdAt: 1,
        })
        .toArray();

    return Response.json({
      success: true,
      replies:
        replies.map(serializeReply),
      repliesCount: replies.length,
    });
  } catch (error) {
    console.error(
      "Eroare la încărcarea răspunsurilor:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Răspunsurile nu au putut fi încărcate.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
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
            "Trebuie să fii autentificat pentru a răspunde.",
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

    const userObjectId =
      getUserObjectId(currentUser);

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

    if (!userObjectId) {
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

    let requestBody;

    try {
      requestBody =
        await request.json();
    } catch {
      return Response.json(
        {
          success: false,
          message:
            "Datele răspunsului nu sunt valide.",
        },
        {
          status: 400,
        }
      );
    }

    const content =
      typeof requestBody?.content ===
      "string"
        ? requestBody.content.trim()
        : "";

    if (!content) {
      return Response.json(
        {
          success: false,
          message:
            "Răspunsul nu poate fi gol.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      content.length >
      MAX_REPLY_LENGTH
    ) {
      return Response.json(
        {
          success: false,
          message:
            `Răspunsul poate avea maximum ${MAX_REPLY_LENGTH} de caractere.`,
        },
        {
          status: 400,
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

    const commentsCollection =
      await getCommentsCollection();

    const parentComment =
      await commentsCollection.findOne({
        _id: commentObjectId,
        postId: postObjectId,
        parentCommentId: {
          $exists: false,
        },
      });

    if (!parentComment) {
      return Response.json(
        {
          success: false,
          message:
            "Comentariul la care răspunzi nu a fost găsit.",
        },
        {
          status: 404,
        }
      );
    }

    const now = new Date();

    const newReply = {
      postId: postObjectId,
      userId: userObjectId,
      parentCommentId:
        commentObjectId,

      username:
        currentUser.username
          ?.toLowerCase() || "",

      name:
        currentUser.name ||
        currentUser.username ||
        "Utilizator",

      avatar:
        currentUser.avatar || null,

      content,

      createdAt: now,
      updatedAt: now,
    };

    const insertResult =
      await commentsCollection.insertOne(
        newReply
      );

    const updatedPost =
      await postsCollection.findOneAndUpdate(
        {
          _id: postObjectId,
        },
        {
          $inc: {
            commentsCount: 1,
          },
        },
        {
          returnDocument: "after",
          projection: {
            commentsCount: 1,
          },
        }
      );

    if (!updatedPost) {
      await commentsCollection.deleteOne({
        _id: insertResult.insertedId,
      });

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

    return Response.json(
      {
        success: true,
        message:
          "Răspunsul a fost publicat.",

        reply: serializeReply({
          ...newReply,
          _id: insertResult.insertedId,
        }),

        commentsCount:
          typeof updatedPost.commentsCount ===
          "number"
            ? updatedPost.commentsCount
            : 1,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Eroare la publicarea răspunsului:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Răspunsul nu a putut fi publicat.",
      },
      {
        status: 500,
      }
    );
  }
}