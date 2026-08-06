import { ObjectId } from "mongodb";

import clientPromise from "../src/app/utils/mongodb.js";

const DATABASE_NAME = "travel-community";
const BULK_WRITE_SIZE = 500;

const ENGAGEMENT_WEIGHTS = Object.freeze({
  likes: 1,
  comments: 2,
  saves: 3,
});

function normalizePostId(value) {
  if (value instanceof ObjectId) {
    return value;
  }

  const candidate = String(value || "").trim();

  return ObjectId.isValid(candidate)
    ? new ObjectId(candidate)
    : null;
}

async function flushOperations(collection, operations) {
  if (operations.length === 0) {
    return;
  }

  await collection.bulkWrite(operations, {
    ordered: false,
  });

  operations.length = 0;
}

async function rebuildCounter({
  sourceCollection,
  postsCollection,
  targetField,
}) {
  const cursor = sourceCollection.aggregate(
    [
      {
        $match: {
          postId: {
            $exists: true,
            $ne: null,
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
    ],
    {
      allowDiskUse: true,
    }
  );

  const operations = [];

  for await (const item of cursor) {
    const postObjectId = normalizePostId(item._id);

    if (!postObjectId) {
      continue;
    }

    operations.push({
      updateOne: {
        filter: {
          _id: postObjectId,
        },
        update: {
          $set: {
            [targetField]: Math.max(
              0,
              Number(item.count) || 0
            ),
          },
        },
      },
    });

    if (operations.length >= BULK_WRITE_SIZE) {
      await flushOperations(postsCollection, operations);
    }
  }

  await flushOperations(postsCollection, operations);
}

async function rebuildEngagementRanking(database) {
  const postsCollection = database.collection("posts");
  const likesCollection = database.collection("likes");
  const commentsCollection = database.collection("comments");
  const savedPostsCollection = database.collection("savedPosts");

  await postsCollection.updateMany(
    {},
    {
      $set: {
        likesCount: 0,
        commentsCount: 0,
        savesCount: 0,
        engagementScore: 0,
      },
    }
  );

  await rebuildCounter({
    sourceCollection: likesCollection,
    postsCollection,
    targetField: "likesCount",
  });

  console.info("Post like counters rebuilt.");

  await rebuildCounter({
    sourceCollection: commentsCollection,
    postsCollection,
    targetField: "commentsCount",
  });

  console.info("Post comment and reply counters rebuilt.");

  await rebuildCounter({
    sourceCollection: savedPostsCollection,
    postsCollection,
    targetField: "savesCount",
  });

  console.info("Post save counters rebuilt.");

  await postsCollection.updateMany(
    {},
    [
      {
        $set: {
          likesCount: {
            $max: [
              0,
              {
                $ifNull: ["$likesCount", 0],
              },
            ],
          },
          commentsCount: {
            $max: [
              0,
              {
                $ifNull: ["$commentsCount", 0],
              },
            ],
          },
          savesCount: {
            $max: [
              0,
              {
                $ifNull: ["$savesCount", 0],
              },
            ],
          },
        },
      },
      {
        $set: {
          engagementScore: {
            $add: [
              {
                $multiply: [
                  "$likesCount",
                  ENGAGEMENT_WEIGHTS.likes,
                ],
              },
              {
                $multiply: [
                  "$commentsCount",
                  ENGAGEMENT_WEIGHTS.comments,
                ],
              },
              {
                $multiply: [
                  "$savesCount",
                  ENGAGEMENT_WEIGHTS.saves,
                ],
              },
            ],
          },
        },
      },
    ]
  );

  await postsCollection.createIndex(
    {
      engagementScore: -1,
      createdAt: -1,
      _id: -1,
    },
    {
      name: "posts_by_engagement",
    }
  );

  console.info("Post engagement scores and ranking index ready.");
}

async function run() {
  const client = await clientPromise;
  const database = client.db(DATABASE_NAME);

  try {
    await rebuildEngagementRanking(database);

    console.info(
      "Post engagement ranking migration completed successfully."
    );
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error(
    "Post engagement ranking migration failed:",
    error
  );
  process.exitCode = 1;
});
