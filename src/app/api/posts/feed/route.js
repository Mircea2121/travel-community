import { Buffer } from "node:buffer";

import { ObjectId } from "mongodb";

import { getCurrentUser } from "../../../utils/currentUser";
import {
  getDatabase,
  getPostsCollection,
} from "../../../utils/database";
import {
  getPublicAuthorProfilesByIds,
  hydratePublicAuthor,
} from "../../../utils/publicUser";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 24;
const DESCRIPTION_PREVIEW_LENGTH = 320;
const VALID_SCOPES = new Set(["all", "following"]);

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}

function getLimit(searchParams) {
  const rawLimit = Number(searchParams.get("limit"));

  if (!Number.isInteger(rawLimit)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(rawLimit, 1), MAX_LIMIT);
}

function getObjectId(value) {
  const normalizedValue = String(value || "");

  if (!ObjectId.isValid(normalizedValue)) {
    return null;
  }

  return new ObjectId(normalizedValue);
}

function getObjectIds(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  const uniqueIds = new Map();

  for (const value of values) {
    const objectId = getObjectId(value);

    if (objectId) {
      uniqueIds.set(objectId.toString(), objectId);
    }
  }

  return [...uniqueIds.values()];
}

function encodeCursor(post) {
  if (!post?._id || !post?.createdAt) {
    return null;
  }

  const createdAt = new Date(post.createdAt);

  if (Number.isNaN(createdAt.getTime())) {
    return null;
  }

  return Buffer.from(
    JSON.stringify({
      createdAt: createdAt.toISOString(),
      id: post._id.toString(),
    }),
    "utf8"
  ).toString("base64url");
}

function decodeCursor(rawCursor) {
  if (!rawCursor) {
    return null;
  }

  try {
    const parsedCursor = JSON.parse(
      Buffer.from(rawCursor, "base64url").toString("utf8")
    );

    const createdAt = new Date(parsedCursor?.createdAt);
    const id = getObjectId(parsedCursor?.id);

    if (Number.isNaN(createdAt.getTime()) || !id) {
      return null;
    }

    return {
      createdAt,
      id,
    };
  } catch {
    return null;
  }
}

function createCursorFilter(cursor) {
  if (!cursor) {
    return null;
  }

  return {
    $or: [
      {
        createdAt: {
          $lt: cursor.createdAt,
        },
      },
      {
        createdAt: cursor.createdAt,
        _id: {
          $lt: cursor.id,
        },
      },
    ],
  };
}

function serializePost(post, interactionState) {
  const postId = post._id.toString();
  const authorId = post.authorId?.toString?.() || "";
  const description =
    typeof post.description === "string"
      ? post.description
      : "";
  const originalDescriptionLength =
    Number.isInteger(post.originalDescriptionLength)
      ? post.originalDescriptionLength
      : description.length;

  return {
    ...post,
    _id: postId,
    id: postId,
    authorId,
    description,
    currency:
      typeof post.currency === "string" && post.currency
        ? post.currency.toUpperCase()
        : "EUR",
    likesCount: Number.isFinite(post.likesCount)
      ? post.likesCount
      : 0,
    commentsCount: Number.isFinite(post.commentsCount)
      ? post.commentsCount
      : 0,
    savesCount: interactionState.saveCounts.get(postId) || 0,
    isLiked: interactionState.likedPostIds.has(postId),
    isSaved: interactionState.savedPostIds.has(postId),
    isDescriptionTruncated:
      originalDescriptionLength > description.length,
    originalDescriptionLength: undefined,
  };
}

async function getInteractionState(database, userId, postIds) {
  const emptyState = {
    likedPostIds: new Set(),
    savedPostIds: new Set(),
    saveCounts: new Map(),
  };

  if (postIds.length === 0) {
    return emptyState;
  }

  const likesCollection = database.collection("likes");
  const savedPostsCollection = database.collection("savedPosts");

  const statePromises = [
    savedPostsCollection
      .aggregate([
        {
          $match: {
            postId: {
              $in: postIds,
            },
          },
        },
        {
          $group: {
            _id: "$postId",
            count: {
              $sum: 1,
            },
          },
        },
      ])
      .toArray(),
  ];

  if (userId) {
    statePromises.push(
      likesCollection.distinct("postId", {
        userId,
        postId: {
          $in: postIds,
        },
      }),
      savedPostsCollection.distinct("postId", {
        userId,
        postId: {
          $in: postIds,
        },
      })
    );
  }

  const [saveCountRows, likedPostIds = [], savedPostIds = []] =
    await Promise.all(statePromises);

  return {
    likedPostIds: new Set(
      likedPostIds.map((postId) => postId.toString())
    ),
    savedPostIds: new Set(
      savedPostIds.map((postId) => postId.toString())
    ),
    saveCounts: new Map(
      saveCountRows.map((row) => [
        row._id.toString(),
        row.count,
      ])
    ),
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") || "all";
    const limit = getLimit(searchParams);
    const rawCursor = searchParams.get("cursor");

    if (!VALID_SCOPES.has(scope)) {
      return jsonResponse(
        {
          success: false,
          message: "Tipul feedului nu este valid.",
        },
        400
      );
    }

    const cursor = decodeCursor(rawCursor);

    if (rawCursor && !cursor) {
      return jsonResponse(
        {
          success: false,
          message: "Cursorul de paginare nu este valid.",
        },
        400
      );
    }

    const currentUser = await getCurrentUser();

    if (scope === "following" && !currentUser) {
      return jsonResponse(
        {
          success: false,
          code: "AUTH_REQUIRED",
          message:
            "Trebuie să fii autentificat pentru a vedea postările persoanelor urmărite.",
        },
        401
      );
    }

    const filterParts = [];
    const cursorFilter = createCursorFilter(cursor);

    if (cursorFilter) {
      filterParts.push(cursorFilter);
    }

    if (scope === "following") {
      const followedUserIds = getObjectIds(currentUser?.following);

      if (followedUserIds.length === 0) {
        return jsonResponse({
          success: true,
          scope,
          posts: [],
          pagination: {
            limit,
            hasMore: false,
            nextCursor: null,
          },
        });
      }

      filterParts.push({
        authorId: {
          $in: followedUserIds,
        },
      });
    }

    const matchFilter =
      filterParts.length === 0
        ? {}
        : filterParts.length === 1
          ? filterParts[0]
          : {
              $and: filterParts,
            };

    const postsCollection = await getPostsCollection();
    const database = await getDatabase();

    const fetchedPosts = await postsCollection
      .aggregate([
        {
          $match: matchFilter,
        },
        {
          $sort: {
            createdAt: -1,
            _id: -1,
          },
        },
        {
          $limit: limit + 1,
        },
        {
          $project: {
            authorId: 1,
            username: 1,
            name: 1,
            avatar: 1,
            title: 1,
            destination: 1,
            country: 1,
            city: 1,
            category: 1,
            travelPeriod: 1,
            totalCost: 1,
            currency: 1,
            description: {
              $substrCP: [
                {
                  $ifNull: ["$description", ""],
                },
                0,
                DESCRIPTION_PREVIEW_LENGTH,
              ],
            },
            originalDescriptionLength: {
              $strLenCP: {
                $ifNull: ["$description", ""],
              },
            },
            images: {
              $slice: [
                {
                  $ifNull: ["$images", []],
                },
                1,
              ],
            },
            likesCount: 1,
            commentsCount: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ])
      .toArray();

    const hasMore = fetchedPosts.length > limit;
    const pagePosts = hasMore
      ? fetchedPosts.slice(0, limit)
      : fetchedPosts;
    const postIds = pagePosts.map((post) => post._id);
    const currentUserId = getObjectId(currentUser?._id);

    const [authorProfiles, interactionState] = await Promise.all([
      getPublicAuthorProfilesByIds(
        pagePosts.map((post) => post.authorId)
      ),
      getInteractionState(database, currentUserId, postIds),
    ]);

    const posts = pagePosts.map((post) => {
      const hydratedPost = hydratePublicAuthor(
        post,
        authorProfiles,
        {
          userIdField: "authorId",
        }
      );

      return serializePost(hydratedPost, interactionState);
    });

    return jsonResponse({
      success: true,
      scope,
      posts,
      pagination: {
        limit,
        hasMore,
        nextCursor:
          hasMore && pagePosts.length > 0
            ? encodeCursor(pagePosts[pagePosts.length - 1])
            : null,
      },
    });
  } catch (error) {
    console.error("Eroare la încărcarea feedului:", error);

    return jsonResponse(
      {
        success: false,
        message: "Feedul nu a putut fi încărcat momentan.",
      },
      500
    );
  }
}
