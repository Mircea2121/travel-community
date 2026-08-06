import { ObjectId } from "mongodb";

import { getUsersCollection } from "./database";
import { getProfileStats } from "./profileStats";

function getPublicAvatar(avatar) {
  if (typeof avatar === "string" && avatar.trim()) {
    return avatar.trim();
  }

  if (
    avatar &&
    typeof avatar === "object" &&
    typeof avatar.url === "string" &&
    avatar.url.trim()
  ) {
    return {
      url: avatar.url.trim(),
    };
  }

  return null;
}

function getValidUserObjectIds(userIds) {
  const objectIdsByValue = new Map();

  for (const userId of Array.isArray(userIds) ? userIds : []) {
    const value = String(userId || "").trim();

    if (ObjectId.isValid(value) && !objectIdsByValue.has(value)) {
      objectIdsByValue.set(value, new ObjectId(value));
    }
  }

  return [...objectIdsByValue.values()];
}

export async function getPublicAuthorProfilesByIds(userIds) {
  const userObjectIds = getValidUserObjectIds(userIds);

  if (userObjectIds.length === 0) {
    return new Map();
  }

  const usersCollection = await getUsersCollection();
  const users = await usersCollection
    .find(
      {
        _id: {
          $in: userObjectIds,
        },
      },
      {
        projection: {
          _id: 1,
          name: 1,
          username: 1,
          avatar: 1,
        },
      }
    )
    .toArray();

  return new Map(
    users.map((user) => [
      user._id.toString(),
      {
        name:
          typeof user.name === "string" && user.name.trim()
            ? user.name.trim()
            : typeof user.username === "string"
              ? user.username.trim()
              : "Utilizator",
        username:
          typeof user.username === "string"
            ? user.username.trim().toLowerCase()
            : "",
        avatar: getPublicAvatar(user.avatar),
      },
    ])
  );
}

export function hydratePublicAuthor(
  content,
  profilesById,
  { userIdField = "userId" } = {}
) {
  if (!content || !(profilesById instanceof Map)) {
    return content;
  }

  const userId = String(content[userIdField] || "").trim();
  const profile = profilesById.get(userId);

  if (!profile) {
    return content;
  }

  return {
    ...content,
    name: profile.name,
    username: profile.username,
    avatar: profile.avatar,
  };
}

export async function getPublicUser(user) {
  const profileData =
    await getProfileStats(user._id);

  return {
    id: user._id.toString(),

    name: user.name,
    username: user.username,

    bio: user.bio,
    location: user.location,

    avatar: user.avatar,
    coverImage: user.coverImage,

    stats: profileData.stats,
    level: profileData.level,

    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
