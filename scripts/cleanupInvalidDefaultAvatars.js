import clientPromise from "../src/app/utils/mongodb.js";

const DATABASE_NAME = "travel-community";
const INVALID_DEFAULT_AVATAR_PATTERN = /(?:^|\/)defaults\/avatar\.png(?:\?.*)?$/i;

function getConfiguredDefaultAvatarUrl() {
  return typeof process.env.DEFAULT_AVATAR_URL === "string"
    ? process.env.DEFAULT_AVATAR_URL.trim()
    : "";
}

function createInvalidAvatarFilter() {
  const configuredDefaultAvatarUrl = getConfiguredDefaultAvatarUrl();
  const invalidValues = [
    {
      avatar: {
        $type: "string",
        $regex: INVALID_DEFAULT_AVATAR_PATTERN,
      },
    },
    {
      "avatar.url": {
        $type: "string",
        $regex: INVALID_DEFAULT_AVATAR_PATTERN,
      },
    },
  ];

  if (configuredDefaultAvatarUrl) {
    invalidValues.push(
      {
        avatar: configuredDefaultAvatarUrl,
      },
      {
        "avatar.url": configuredDefaultAvatarUrl,
      }
    );
  }

  return {
    $or: invalidValues,
  };
}

async function run() {
  const client = await clientPromise;
  const database = client.db(DATABASE_NAME);
  const usersCollection = database.collection("users");

  try {
    const result = await usersCollection.updateMany(
      createInvalidAvatarFilter(),
      {
        $set: {
          avatar: null,
          updatedAt: new Date(),
        },
      }
    );

    console.info(
      `Invalid default avatars cleaned successfully. Matched: ${result.matchedCount}, updated: ${result.modifiedCount}.`
    );
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error("Invalid default avatar cleanup failed:", error);
  process.exitCode = 1;
});
