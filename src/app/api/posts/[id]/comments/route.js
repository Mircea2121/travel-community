import { ObjectId } from "mongodb";

import { getCurrentUser } from "../../../../utils/currentUser";
import {
  getPublicAuthorProfilesByIds,
  hydratePublicAuthor,
} from "../../../../utils/publicUser";

import {
  getDatabase,
  getPostsCollection,
} from "../../../../utils/database";
import { updatePostEngagement } from "../../../../utils/postEngagement";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_COMMENT_LENGTH = 1500;
const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 50;

const NO_CACHE_HEADERS = {
  "Cache-Control":
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

let commentsIndexesPromise = null;

async function getCommentsCollection() {
  const database =
    await getDatabase();

  const commentsCollection =
    database.collection("comments");

  if (!commentsIndexesPromise) {
    commentsIndexesPromise =
      Promise.all([
        commentsCollection.createIndex(
          {
            postId: 1,
            parentCommentId: 1,
            createdAt: 1,
          },
          {
            name:
              "replies_by_parent_comment",
          }
        ),

        commentsCollection.createIndex(
          {
            userId: 1,
            createdAt: -1,
          },
          {
            name:
              "comments_by_user",
          }
        ),
      ]);
  }

  await commentsIndexesPromise;

  return commentsCollection;
}
function getValidPostId(id) {
  if (
    !id ||
    !ObjectId.isValid(id)
  ) {
    return null;
  }

  return new ObjectId(id);
}

function getUserObjectId(
  currentUser
) {
  const userId = String(
    currentUser?._id || ""
  );

  if (
    !ObjectId.isValid(userId)
  ) {
    return null;
  }

  return new ObjectId(userId);
}

function serializeComment(
  comment,
  repliesCount = 0
) {
  return {
    ...comment,

    _id: String(
      comment._id
    ),

    postId: String(
      comment.postId
    ),

    userId: String(
      comment.userId
    ),

    repliesCount:
      Number.isFinite(
        Number(repliesCount)
      )
        ? Number(repliesCount)
        : 0,
  };
}

function getLimit(request) {
  const { searchParams } =
    new URL(request.url);

  const rawLimit =
    searchParams.get("limit");

  /*
    Dacă parametrul limit nu există,
    folosim limita implicită.

    Number(null) este 0, iar înainte
    acest lucru transforma limita în 1.
  */
  if (
    rawLimit === null ||
    rawLimit.trim() === ""
  ) {
    return DEFAULT_LIMIT;
  }

  const requestedLimit =
    Number(rawLimit);

  if (
    !Number.isFinite(
      requestedLimit
    )
  ) {
    return DEFAULT_LIMIT;
  }

  return Math.min(
    Math.max(
      Math.floor(
        requestedLimit
      ),
      1
    ),
    MAX_LIMIT
  );
}

function getSkip(request) {
  const { searchParams } =
    new URL(request.url);

  const rawSkip =
    searchParams.get("skip");

  if (
    rawSkip === null ||
    rawSkip.trim() === ""
  ) {
    return 0;
  }

  const requestedSkip =
    Number(rawSkip);

  if (
    !Number.isFinite(
      requestedSkip
    )
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(
      requestedSkip
    )
  );
}

function isMainComment(comment) {
  return (
    comment?.parentCommentId ===
      undefined ||
    comment?.parentCommentId ===
      null
  );
}

function isReply(comment) {
  return Boolean(
    comment?.parentCommentId
  );
}

function jsonResponse(
  body,
  status = 200
) {
  return Response.json(
    body,
    {
      status,
      headers:
        NO_CACHE_HEADERS,
    }
  );
}

export async function GET(
  request,
  { params }
) {
  try {
    const { id } =
      await params;

    const postObjectId =
      getValidPostId(id);

    if (!postObjectId) {
      return jsonResponse(
        {
          success: false,
          message:
            "ID-ul postării nu este valid.",
        },
        400
      );
    }

    const postsCollection =
      await getPostsCollection();

    const post =
      await postsCollection.findOne(
        {
          _id:
            postObjectId,
        },
        {
          projection: {
            commentsCount: 1,
          },
        }
      );

    if (!post) {
      return jsonResponse(
        {
          success: false,
          message:
            "Postarea nu a fost găsită.",
        },
        404
      );
    }

    const commentsCollection =
      await getCommentsCollection();

    const limit =
      getLimit(request);

    const skip =
      getSkip(request);

    const mainCommentsFilter = {
      postId:
        postObjectId,

      $or: [
        {
          parentCommentId: {
            $exists: false,
          },
        },
        {
          parentCommentId:
            null,
        },
      ],
    };

    const totalMainComments =
      await commentsCollection.countDocuments(
        mainCommentsFilter
      );

    const mainComments =
      await commentsCollection
        .find(
          mainCommentsFilter
        )
        .sort({
          createdAt: -1,
          _id: -1,
        })
        .skip(skip)
        .limit(limit)
        .toArray();

    const mainCommentIds =
      mainComments.map(
        (comment) =>
          comment._id
      );

    const authorProfiles =
      await getPublicAuthorProfilesByIds(
        mainComments.map(
          (comment) => comment.userId
        )
      );

    const repliesCountResults =
      mainCommentIds.length > 0
        ? await commentsCollection
            .aggregate([
              {
                $match: {
                  postId:
                    postObjectId,

                  parentCommentId: {
                    $in:
                      mainCommentIds,
                  },
                },
              },
              {
                $group: {
                  _id:
                    "$parentCommentId",

                  count: {
                    $sum: 1,
                  },
                },
              },
            ])
            .toArray()
        : [];

    const repliesCountMap = {};

      repliesCountResults.forEach(
        (result) => {
          const parentCommentId =
            String(
              result?._id || ""
            );

          if (!parentCommentId) {
            return;
          }

          repliesCountMap[
            parentCommentId
          ] =
            Number.isFinite(
              Number(
                result?.count
              )
            )
              ? Number(
                  result.count
                )
              : 0;
        }
      );

    const serializedComments =
      mainComments.map(
        (comment) => {
          const commentId =
            String(
              comment._id
            );

          const hydratedComment =
            hydratePublicAuthor(
              comment,
              authorProfiles
            );

          return serializeComment(
            hydratedComment,
            repliesCountMap[
              commentId
            ] || 0
          );
        }
      );

    const hasMore =
      skip +
        mainComments.length <
      totalMainComments;

    return jsonResponse({
      success: true,

     comments:
        serializedComments,

      mainCommentsCount:
        totalMainComments,

      commentsCount:
        Number.isFinite(
          Number(
            post.commentsCount
          )
        )
          ? Number(
              post.commentsCount
            )
          : totalMainComments,

      hasMore,

      nextSkip:
        skip +
        mainComments.length,
    });
  } catch (error) {
    console.error(
      "Eroare la încărcarea comentariilor:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message:
          "Comentariile nu au putut fi încărcate.",
      },
      500
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
      return jsonResponse(
        {
          success: false,
          message:
            "Trebuie să fii autentificat pentru a comenta.",
        },
        401
      );
    }

    const { id } =
      await params;

    const postObjectId =
      getValidPostId(id);

    const userObjectId =
      getUserObjectId(
        currentUser
      );

    if (!postObjectId) {
      return jsonResponse(
        {
          success: false,
          message:
            "ID-ul postării nu este valid.",
        },
        400
      );
    }

    if (!userObjectId) {
      return jsonResponse(
        {
          success: false,
          message:
            "Utilizatorul autentificat nu este valid.",
        },
        401
      );
    }

    let requestBody;

    try {
      requestBody =
        await request.json();
    } catch {
      return jsonResponse(
        {
          success: false,
          message:
            "Datele comentariului nu sunt valide.",
        },
        400
      );
    }

    const content =
      typeof requestBody?.content ===
      "string"
        ? requestBody.content.trim()
        : "";

    if (!content) {
      return jsonResponse(
        {
          success: false,
          message:
            "Comentariul nu poate fi gol.",
        },
        400
      );
    }

    if (
      content.length >
      MAX_COMMENT_LENGTH
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            `Comentariul poate avea maximum ${MAX_COMMENT_LENGTH} de caractere.`,
        },
        400
      );
    }

    const postsCollection =
      await getPostsCollection();

    const post =
      await postsCollection.findOne(
        {
          _id:
            postObjectId,
        },
        {
          projection: {
            _id: 1,
          },
        }
      );

    if (!post) {
      return jsonResponse(
        {
          success: false,
          message:
            "Postarea nu a fost găsită.",
        },
        404
      );
    }

    const now =
      new Date();

    const newComment = {
      postId:
        postObjectId,

      userId:
        userObjectId,

      username:
        currentUser.username
          ?.toLowerCase()
          .trim() || "",

      name:
        currentUser.name ||
        currentUser.username ||
        "Utilizator",

      avatar:
        currentUser.avatar ||
        null,

      content,

      createdAt:
        now,

      updatedAt:
        now,
    };

    const commentsCollection =
      await getCommentsCollection();

    const insertResult =
      await commentsCollection.insertOne(
        newComment
      );

    let updatedPost;

    try {
      updatedPost =
        await updatePostEngagement({
          postsCollection,
          postId:
            postObjectId,
          commentsDelta: 1,
          projection: {
            commentsCount: 1,
            engagementScore: 1,
          },
        });
    } catch (error) {
      await commentsCollection.deleteOne(
        {
          _id:
            insertResult.insertedId,
        }
      );

      throw error;
    }

    if (!updatedPost) {
      await commentsCollection.deleteOne(
        {
          _id:
            insertResult.insertedId,
        }
      );

      return jsonResponse(
        {
          success: false,
          message:
            "Postarea nu a fost găsită.",
        },
        404
      );
    }

    return jsonResponse(
      {
        success: true,

        message:
          "Comentariul a fost publicat.",

        comment:
          serializeComment(
            {
              ...newComment,

              _id:
                insertResult.insertedId,
            },
            0
          ),

        commentsCount:
          typeof updatedPost.commentsCount ===
          "number"
            ? updatedPost.commentsCount
            : 1,
      },
      201
    );
  } catch (error) {
    console.error(
      "Eroare la publicarea comentariului:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message:
          "Comentariul nu a putut fi publicat.",
      },
      500
    );
  }
}
