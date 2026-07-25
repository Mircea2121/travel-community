import { ObjectId } from "mongodb";

import { getCurrentUser } from "../../../../utils/currentUser";
import {
  getDatabase,
  getPostsCollection,
} from "../../../../utils/database";

const MAX_COMMENT_LENGTH = 1500;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

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
          createdAt: 1,
        },
        {
          name: "comments_by_post",
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

function getValidPostId(id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  return new ObjectId(id);
}

function getUserObjectId(currentUser) {
  if (!currentUser?._id) {
    return null;
  }

  const userId = String(currentUser._id);

  if (!ObjectId.isValid(userId)) {
    return null;
  }

  return new ObjectId(userId);
}

function serializeComment(comment) {
  return {
    ...comment,
    _id: String(comment._id),
    postId: String(comment.postId),
    userId: String(comment.userId),
  };
}

function getLimit(request) {
  const { searchParams } = new URL(request.url);

  const requestedLimit = Number(
    searchParams.get("limit")
  );

  if (!Number.isFinite(requestedLimit)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(
    Math.max(Math.floor(requestedLimit), 1),
    MAX_LIMIT
  );
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const postObjectId = getValidPostId(id);

    if (!postObjectId) {
      return Response.json(
        {
          success: false,
          message: "ID-ul postării nu este valid.",
        },
        {
          status: 400,
        }
      );
    }

    const postsCollection = await getPostsCollection();

    const post = await postsCollection.findOne(
      {
        _id: postObjectId,
      },
      {
        projection: {
          commentsCount: 1,
        },
      }
    );

    if (!post) {
      return Response.json(
        {
          success: false,
          message: "Postarea nu a fost găsită.",
        },
        {
          status: 404,
        }
      );
    }

    const commentsCollection =
      await getCommentsCollection();

    const limit = getLimit(request);

    const comments = await commentsCollection
      .find({
        postId: postObjectId,
      })
      .sort({
        createdAt: 1,
      })
      .limit(limit)
      .toArray();

    return Response.json({
      success: true,
      comments: comments.map(serializeComment),
      commentsCount:
        typeof post.commentsCount === "number"
          ? post.commentsCount
          : comments.length,
    });
  } catch (error) {
    console.error(
      "Eroare la încărcarea comentariilor:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Comentariile nu au putut fi încărcate.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return Response.json(
        {
          success: false,
          message:
            "Trebuie să fii autentificat pentru a comenta.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await params;

    const postObjectId = getValidPostId(id);
    const userObjectId =
      getUserObjectId(currentUser);

    if (!postObjectId) {
      return Response.json(
        {
          success: false,
          message: "ID-ul postării nu este valid.",
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
      requestBody = await request.json();
    } catch {
      return Response.json(
        {
          success: false,
          message:
            "Datele comentariului nu sunt valide.",
        },
        {
          status: 400,
        }
      );
    }

    const content =
      typeof requestBody?.content === "string"
        ? requestBody.content.trim()
        : "";

    if (!content) {
      return Response.json(
        {
          success: false,
          message:
            "Comentariul nu poate fi gol.",
        },
        {
          status: 400,
        }
      );
    }

    if (content.length > MAX_COMMENT_LENGTH) {
      return Response.json(
        {
          success: false,
          message:
            `Comentariul poate avea maximum ${MAX_COMMENT_LENGTH} de caractere.`,
        },
        {
          status: 400,
        }
      );
    }

    const postsCollection = await getPostsCollection();

    const post = await postsCollection.findOne(
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
          message: "Postarea nu a fost găsită.",
        },
        {
          status: 404,
        }
      );
    }

    const now = new Date();

    const newComment = {
      postId: postObjectId,
      userId: userObjectId,

      username:
        currentUser.username?.toLowerCase() || "",

      name:
        currentUser.name ||
        currentUser.username ||
        "Utilizator",

      avatar: currentUser.avatar || null,

      content,

      createdAt: now,
      updatedAt: now,
    };

    const commentsCollection =
      await getCommentsCollection();

    const insertResult =
      await commentsCollection.insertOne(
        newComment
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
          message: "Postarea nu a fost găsită.",
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
          "Comentariul a fost publicat.",
        comment: serializeComment({
          ...newComment,
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
      "Eroare la publicarea comentariului:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Comentariul nu a putut fi publicat.",
      },
      {
        status: 500,
      }
    );
  }
}