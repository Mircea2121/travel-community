import { destinations } from "../../data/destinations";
import {
  getPostsCollection,
  getUsersCollection,
} from "../../utils/database";
import {
  getPublicAuthorProfilesByIds,
  hydratePublicAuthor,
} from "../../utils/publicUser";

export const runtime = "nodejs";

const USERS_INDEX_NAME = "global_users_v1";
const POSTS_INDEX_NAME = "global_posts_v1";
const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 80;
const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 18;
const DESCRIPTION_PREVIEW_LENGTH = 220;

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control":
        status === 200
          ? "public, s-maxage=30, stale-while-revalidate=120"
          : "no-store",
    },
  });
}

function normalizeQuery(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ");
}

function normalizeComparable(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("ro-RO");
}

function getLimit(searchParams) {
  const value = Number(searchParams.get("limit"));

  if (!Number.isInteger(value)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(value, 1), MAX_LIMIT);
}

function getRequestedType(searchParams) {
  const type = searchParams.get("type")?.trim().toLowerCase();

  return ["all", "profiles", "experiences"].includes(type)
    ? type
    : "all";
}

function getAvatar(avatar) {
  if (typeof avatar === "string" && avatar.trim()) {
    return avatar.trim();
  }

  if (
    avatar &&
    typeof avatar === "object" &&
    typeof avatar.url === "string" &&
    avatar.url.trim()
  ) {
    return avatar.url.trim();
  }

  return "";
}

function getImageUrl(image) {
  if (typeof image === "string") {
    return image.trim();
  }

  if (image && typeof image.url === "string") {
    return image.url.trim();
  }

  if (image && typeof image.secureUrl === "string") {
    return image.secureUrl.trim();
  }

  return "";
}

function serializeProfile(user) {
  return {
    id: user._id.toString(),
    name:
      typeof user.name === "string" && user.name.trim()
        ? user.name.trim()
        : user.username || "Utilizator",
    username:
      typeof user.username === "string"
        ? user.username.trim().toLowerCase()
        : "",
    location:
      typeof user.location === "string" ? user.location.trim() : "",
    bio: typeof user.bio === "string" ? user.bio.trim() : "",
    avatar: getAvatar(user.avatar),
    score: Number(user.score) || 0,
  };
}

function serializeExperience(post) {
  const postId = post._id.toString();
  const firstImage = Array.isArray(post.images) ? post.images[0] : null;

  return {
    id: postId,
    authorId: post.authorId?.toString?.() || "",
    name: post.name || post.username || "Utilizator",
    username: post.username || "",
    avatar: getAvatar(post.avatar),
    title: post.title || "Experiență de călătorie",
    destination: post.destination || "",
    country: post.country || "",
    city: post.city || "",
    category: post.category || "",
    description: post.description || "",
    image: getImageUrl(firstImage),
    createdAt: post.createdAt || null,
    score: Number(post.score) || 0,
  };
}

function getCuratedDestinations(query, limit) {
  const comparableQuery = normalizeComparable(query);

  return destinations
    .filter((destination) =>
      normalizeComparable(destination.country).includes(comparableQuery)
    )
    .slice(0, Math.min(limit, 6))
    .map((destination) => ({
      id: String(destination.id),
      country: destination.country,
      slug: destination.slug,
      coverImage: destination.coverImage,
    }));
}

async function searchProfiles(query, limit) {
  const usersCollection = await getUsersCollection();

  return usersCollection
    .aggregate([
      {
        $search: {
          index: USERS_INDEX_NAME,
          compound: {
            should: [
              {
                autocomplete: {
                  query,
                  path: "name",
                  fuzzy: { maxEdits: 1, prefixLength: 2 },
                  score: { boost: { value: 4 } },
                },
              },
              {
                autocomplete: {
                  query,
                  path: "username",
                  fuzzy: { maxEdits: 1, prefixLength: 2 },
                  score: { boost: { value: 5 } },
                },
              },
              {
                autocomplete: {
                  query,
                  path: "location",
                  fuzzy: { maxEdits: 1, prefixLength: 2 },
                },
              },
            ],
            minimumShouldMatch: 1,
            mustNot: [
              {
                equals: {
                  path: "accountStatus",
                  value: "deleted",
                },
              },
            ],
          },
        },
      },
      { $limit: limit },
      {
        $project: {
          name: 1,
          username: 1,
          location: 1,
          bio: 1,
          avatar: 1,
          score: { $meta: "searchScore" },
        },
      },
    ])
    .toArray();
}

async function searchExperiences(query, limit) {
  const postsCollection = await getPostsCollection();

  const posts = await postsCollection
    .aggregate([
      {
        $search: {
          index: POSTS_INDEX_NAME,
          compound: {
            should: [
              {
                autocomplete: {
                  query,
                  path: "title",
                  fuzzy: { maxEdits: 1, prefixLength: 2 },
                  score: { boost: { value: 5 } },
                },
              },
              {
                autocomplete: {
                  query,
                  path: "destination",
                  fuzzy: { maxEdits: 1, prefixLength: 2 },
                  score: { boost: { value: 5 } },
                },
              },
              {
                autocomplete: {
                  query,
                  path: "country",
                  fuzzy: { maxEdits: 1, prefixLength: 2 },
                  score: { boost: { value: 4 } },
                },
              },
              {
                autocomplete: {
                  query,
                  path: "city",
                  fuzzy: { maxEdits: 1, prefixLength: 2 },
                  score: { boost: { value: 4 } },
                },
              },
              {
                autocomplete: {
                  query,
                  path: "category",
                  fuzzy: { maxEdits: 1, prefixLength: 2 },
                },
              },
              {
                text: {
                  query,
                  path: ["description", "tips"],
                  fuzzy: { maxEdits: 1, prefixLength: 3 },
                },
              },
            ],
            minimumShouldMatch: 1,
          },
        },
      },
      { $limit: limit },
      {
        $project: {
          authorId: 1,
          name: 1,
          username: 1,
          avatar: 1,
          title: 1,
          destination: 1,
          country: 1,
          city: 1,
          category: 1,
          description: {
            $substrCP: [
              { $ifNull: ["$description", ""] },
              0,
              DESCRIPTION_PREVIEW_LENGTH,
            ],
          },
          images: { $slice: [{ $ifNull: ["$images", []] }, 1] },
          createdAt: 1,
          score: { $meta: "searchScore" },
        },
      },
    ])
    .toArray();

  const profiles = await getPublicAuthorProfilesByIds(
    posts.map((post) => post.authorId)
  );

  return posts.map((post) =>
    hydratePublicAuthor(post, profiles, { userIdField: "authorId" })
  );
}

function isSearchIndexError(error) {
  const message = String(error?.message || "").toLowerCase();

  return (
    message.includes("search index") ||
    message.includes("$search") ||
    message.includes("atlas search")
  );
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = normalizeQuery(searchParams.get("q"));
    const type = getRequestedType(searchParams);
    const limit = getLimit(searchParams);

    if (query.length < MIN_QUERY_LENGTH) {
      return jsonResponse(
        {
          success: false,
          message: `Scrie cel puțin ${MIN_QUERY_LENGTH} caractere.`,
        },
        400
      );
    }

    if (query.length > MAX_QUERY_LENGTH) {
      return jsonResponse(
        {
          success: false,
          message: `Căutarea poate avea cel mult ${MAX_QUERY_LENGTH} de caractere.`,
        },
        400
      );
    }

    const includeProfiles = type === "all" || type === "profiles";
    const includeExperiences = type === "all" || type === "experiences";

    const [profileDocuments, experienceDocuments] = await Promise.all([
      includeProfiles ? searchProfiles(query, limit) : Promise.resolve([]),
      includeExperiences
        ? searchExperiences(query, limit)
        : Promise.resolve([]),
    ]);

    const profiles = profileDocuments.map(serializeProfile);
    const experiences = experienceDocuments.map(serializeExperience);
    const curatedDestinations = includeExperiences
      ? getCuratedDestinations(query, limit)
      : [];

    return jsonResponse({
      success: true,
      query,
      type,
      results: {
        profiles,
        destinations: curatedDestinations,
        experiences,
      },
      counts: {
        profiles: profiles.length,
        destinations: curatedDestinations.length,
        experiences: experiences.length,
        total:
          profiles.length +
          curatedDestinations.length +
          experiences.length,
      },
    });
  } catch (error) {
    console.error("Eroare la căutarea globală:", error);

    if (isSearchIndexError(error)) {
      return jsonResponse(
        {
          success: false,
          code: "SEARCH_INDEX_NOT_READY",
          message:
            "Căutarea este în curs de configurare. Încearcă din nou în câteva minute.",
        },
        503
      );
    }

    return jsonResponse(
      {
        success: false,
        message: "Căutarea nu este disponibilă momentan.",
      },
      500
    );
  }
}
