import { getPostsCollection } from "../../../utils/database";
import {
  getPublicAuthorProfilesByIds,
  hydratePublicAuthor,
} from "../../../utils/publicUser";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 12;
const DESCRIPTION_PREVIEW_LENGTH = 320;

const CACHE_HEADERS = {
  "Cache-Control":
    "public, s-maxage=60, stale-while-revalidate=300",
};

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers:
      status === 200
        ? CACHE_HEADERS
        : {
            "Cache-Control": "no-store",
          },
  });
}

function getLimit(searchParams) {
  const rawLimit = searchParams.get("limit");

  if (rawLimit === null || rawLimit.trim() === "") {
    return DEFAULT_LIMIT;
  }

  const requestedLimit = Number(rawLimit);

  if (!Number.isInteger(requestedLimit)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(
    Math.max(requestedLimit, 1),
    MAX_LIMIT
  );
}

function getSafeCount(value) {
  return Number.isFinite(Number(value))
    ? Math.max(0, Number(value))
    : 0;
}

function serializePost(post) {
  const postId = post._id.toString();
  const description =
    typeof post.description === "string"
      ? post.description
      : "";
  const originalDescriptionLength = Number.isInteger(
    post.originalDescriptionLength
  )
    ? post.originalDescriptionLength
    : description.length;

  return {
    ...post,
    _id: postId,
    id: postId,
    authorId: post.authorId?.toString?.() || "",
    description,
    currency:
      typeof post.currency === "string" && post.currency
        ? post.currency.toUpperCase()
        : "EUR",
    likesCount: getSafeCount(post.likesCount),
    commentsCount: getSafeCount(post.commentsCount),
    savesCount: getSafeCount(post.savesCount),
    engagementScore: getSafeCount(post.engagementScore),
    isLiked: false,
    isSaved: false,
    isDescriptionTruncated:
      originalDescriptionLength > description.length,
    originalDescriptionLength: undefined,
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = getLimit(searchParams);
    const postsCollection = await getPostsCollection();

    const posts = await postsCollection
      .aggregate([
        {
          $sort: {
            engagementScore: -1,
            createdAt: -1,
            _id: -1,
          },
        },
        {
          $limit: limit,
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
            savesCount: 1,
            engagementScore: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ])
      .toArray();

    const authorProfiles =
      await getPublicAuthorProfilesByIds(
        posts.map((post) => post.authorId)
      );

    const serializedPosts = posts.map((post) =>
      serializePost(
        hydratePublicAuthor(post, authorProfiles, {
          userIdField: "authorId",
        })
      )
    );

    return jsonResponse({
      success: true,
      posts: serializedPosts,
      ranking: {
        likesWeight: 1,
        commentsWeight: 2,
        savesWeight: 3,
      },
    });
  } catch (error) {
    console.error(
      "Eroare la încărcarea experiențelor populare:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message:
          "Experiențele populare nu au putut fi încărcate momentan.",
      },
      500
    );
  }
}
