import { ObjectId } from "mongodb";

import {
  getDatabase,
  getPostsCollection,
  getUsersCollection,
} from "./database";

const XP_PER_POST = 50;
const XP_PER_COMMENT = 2;
const XP_PER_LIKE_RECEIVED = 1;

const LEVELS = [
  {
    number: 1,
    name: "🥉 Călător începător",
    minimumXp: 0,
    nextLevelXp: 400,
  },

  {
    number: 2,
    name: "🥈 Explorator",
    minimumXp: 400,
    nextLevelXp: 900,
  },

  {
    number: 3,
    name: "🥇 Aventurier",
    minimumXp: 900,
    nextLevelXp: 1600,
  },

  {
    number: 4,
    name: "💎 Maestru al călătoriilor",
    minimumXp: 1600,
    nextLevelXp: 2600,
  },

  {
    number: 5,
    name: "👑 Călător veteran",
    minimumXp: 2600,
    nextLevelXp: null,
  },
];

function normalizeObjectId(userId) {
  const value = String(userId || "");

  if (!ObjectId.isValid(value)) {
    return null;
  }

  return new ObjectId(value);
}

function getUserLevel(totalXp) {
  const safeXp = Math.max(Number(totalXp) || 0, 0);

  let currentLevel = LEVELS[0];

  for (const level of LEVELS) {
    if (safeXp >= level.minimumXp) {
      currentLevel = level;
    }
  }

  const isMaximumLevel =
    currentLevel.number === LEVELS.length;

  const currentLevelXp =
    safeXp - currentLevel.minimumXp;

  const xpRequiredForLevel = isMaximumLevel
    ? 0
    : currentLevel.nextLevelXp -
      currentLevel.minimumXp;

  const xpRemaining = isMaximumLevel
    ? 0
    : Math.max(
        currentLevel.nextLevelXp - safeXp,
        0
      );

  return {
    number: currentLevel.number,
    name: currentLevel.name,

    totalXp: safeXp,

    currentXp: isMaximumLevel
      ? safeXp
      : currentLevelXp,

    nextLevelXp: isMaximumLevel
      ? null
      : xpRequiredForLevel,

    xpRemaining,

    minimumXp: currentLevel.minimumXp,

    nextLevelTotalXp:
      currentLevel.nextLevelXp,

    isMaximumLevel,
  };
}

export async function getProfileStats(userId) {
  const userObjectId =
    normalizeObjectId(userId);

  if (!userObjectId) {
    return {
      stats: {
        postsCount: 0,
        likesReceived: 0,
        followersCount: 0,
        followingCount: 0,
        photosUploaded: 0,
        commentsCount: 0,
      },

      level: getUserLevel(0),
    };
  }

  const database = await getDatabase();

  const usersCollection =
    await getUsersCollection();

  const postsCollection =
    await getPostsCollection();

  const commentsCollection =
    database.collection("comments");

  const [
    user,
    postsSummary,
    commentsCount,
  ] = await Promise.all([
    usersCollection.findOne(
      {
        _id: userObjectId,
      },
      {
        projection: {
          followers: 1,
          following: 1,
        },
      }
    ),

    postsCollection
      .aggregate([
        {
          $match: {
            authorId: userObjectId,
          },
        },
        {
          $group: {
            _id: null,

            postsCount: {
              $sum: 1,
            },

            likesReceived: {
              $sum: {
                $ifNull: [
                  "$likesCount",
                  0,
                ],
              },
            },

            photosUploaded: {
              $sum: {
                $size: {
                  $ifNull: [
                    "$images",
                    [],
                  ],
                },
              },
            },
          },
        },
      ])
      .toArray(),

    commentsCollection.countDocuments({
      userId: userObjectId,
    }),
  ]);

  const summary =
    postsSummary[0] || {};

  const postsCount =
    Number(summary.postsCount) || 0;

  const likesReceived =
    Number(summary.likesReceived) || 0;

  const photosUploaded =
    Number(summary.photosUploaded) || 0;

  const safeCommentsCount =
    Number(commentsCount) || 0;

  const followersCount =
    Array.isArray(user?.followers)
      ? user.followers.length
      : 0;

  const followingCount =
    Array.isArray(user?.following)
      ? user.following.length
      : 0;

  const totalXp =
    postsCount * XP_PER_POST +
    safeCommentsCount * XP_PER_COMMENT +
    likesReceived * XP_PER_LIKE_RECEIVED;

  return {
    stats: {
      postsCount,
      likesReceived,
      followersCount,
      followingCount,
      photosUploaded,
      commentsCount:
        safeCommentsCount,
    },

    level: getUserLevel(totalXp),
  };
}