import { Buffer } from "node:buffer";
import { ObjectId } from "mongodb";

import { getPostsCollection } from "@/app/utils/database";
import {
  getDiscoveryCategory,
  normalizeCountryKey,
} from "@/app/utils/discovery";
import {
  getPublicAuthorProfilesByIds,
  hydratePublicAuthor,
} from "@/app/utils/publicUser";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 24;
const DESCRIPTION_LENGTH = 360;

function getLimit(value) {
  const limit = Number(value);

  return Number.isInteger(limit)
    ? Math.min(Math.max(limit, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;
}

function encodeCursor(post) {
  if (!post?._id || !post?.createdAt) {
    return null;
  }

  return Buffer.from(
    JSON.stringify({
      createdAt: new Date(post.createdAt).toISOString(),
      id: post._id.toString(),
    }),
    "utf8"
  ).toString("base64url");
}

function decodeCursor(value) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    );
    const createdAt = new Date(parsed?.createdAt);

    if (
      Number.isNaN(createdAt.getTime()) ||
      !ObjectId.isValid(String(parsed?.id || ""))
    ) {
      return null;
    }

    return {
      createdAt,
      id: new ObjectId(parsed.id),
    };
  } catch {
    return null;
  }
}

function serializePost(post) {
  const postId = post._id.toString();

  return {
    ...post,
    _id: postId,
    id: postId,
    authorId: post.authorId?.toString?.() || "",
    likesCount: Number(post.likesCount) || 0,
    commentsCount: Number(post.commentsCount) || 0,
    savesCount: Number(post.savesCount) || 0,
    currency: post.currency || "EUR",
  };
}

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category") || "";
    const rawCountry = String(searchParams.get("country") || "").trim();
    const countryKey = normalizeCountryKey(rawCountry);
    const rawCursor = searchParams.get("cursor") || "";
    const limit = getLimit(searchParams.get("limit"));
    const category = categorySlug
      ? getDiscoveryCategory(categorySlug)
      : null;

    if (!category && !countryKey) {
      return Response.json(
        {
          success: false,
          message: "Categoria sau țara solicitată nu este validă.",
        },
        { status: 400 }
      );
    }

    const cursor = decodeCursor(rawCursor);

    if (rawCursor && !cursor) {
      return Response.json(
        { success: false, message: "Pagina solicitată nu este validă." },
        { status: 400 }
      );
    }

    const filters = [];

    if (category) {
      filters.push({ category: { $in: category.categories } });
    }

    if (countryKey) {
      filters.push({
        $or: [
          { countryKey },
          { country: { $regex: `^${escapeRegularExpression(rawCountry)}$`, $options: "i" } },
        ],
      });
    }

    if (cursor) {
      filters.push({
        $or: [
          { createdAt: { $lt: cursor.createdAt } },
          { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
        ],
      });
    }

    const filter = filters.length === 1 ? filters[0] : { $and: filters };
    const postsCollection = await getPostsCollection();
    const rows = await postsCollection
      .aggregate([
        { $match: filter },
        { $sort: { createdAt: -1, _id: -1 } },
        { $limit: limit + 1 },
        {
          $project: {
            authorId: 1,
            username: 1,
            name: 1,
            avatar: 1,
            title: 1,
            destination: 1,
            country: 1,
            countryKey: 1,
            city: 1,
            category: 1,
            travelPeriod: 1,
            totalCost: 1,
            currency: 1,
            description: {
              $substrCP: [
                { $ifNull: ["$description", ""] },
                0,
                DESCRIPTION_LENGTH,
              ],
            },
            images: { $slice: [{ $ifNull: ["$images", []] }, 1] },
            likesCount: 1,
            commentsCount: 1,
            savesCount: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ])
      .toArray();

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const authorProfiles = await getPublicAuthorProfilesByIds(
      pageRows.map((post) => post.authorId)
    );
    const posts = pageRows.map((post) =>
      serializePost(
        hydratePublicAuthor(post, authorProfiles, {
          userIdField: "authorId",
        })
      )
    );

    return Response.json(
      {
        success: true,
        posts,
        pagination: {
          hasMore,
          nextCursor:
            hasMore && pageRows.length
              ? encodeCursor(pageRows[pageRows.length - 1])
              : null,
        },
      },
      { headers: { "Cache-Control": "public, s-maxage=20" } }
    );
  } catch (error) {
    console.error("GET /api/discovery/posts error:", error);

    return Response.json(
      {
        success: false,
        message: "Postările nu au putut fi încărcate momentan.",
      },
      { status: 500 }
    );
  }
}
