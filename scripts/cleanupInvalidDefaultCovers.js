import clientPromise from "../src/app/utils/mongodb.js";

const DATABASE_NAME = "travel-community";
const INVALID_DEFAULT_COVER_PATTERN =
  /(?:^|\/)defaults\/cover\.jpg(?:\?.*)?$/i;

function getConfiguredDefaultCoverUrl() {
  return typeof process.env.DEFAULT_COVER_URL === "string"
    ? process.env.DEFAULT_COVER_URL.trim()
    : "";
}

function createInvalidImageFilter(field) {
  const configuredDefaultCoverUrl = getConfiguredDefaultCoverUrl();
  const invalidValues = [
    {
      [field]: {
        $type: "string",
        $regex: INVALID_DEFAULT_COVER_PATTERN,
      },
    },
    {
      [`${field}.url`]: {
        $type: "string",
        $regex: INVALID_DEFAULT_COVER_PATTERN,
      },
    },
  ];

  if (configuredDefaultCoverUrl) {
    invalidValues.push(
      { [field]: configuredDefaultCoverUrl },
      { [`${field}.url`]: configuredDefaultCoverUrl }
    );
  }

  return { $or: invalidValues };
}

async function cleanField(usersCollection, field) {
  const result = await usersCollection.updateMany(
    createInvalidImageFilter(field),
    {
      $set: {
        [field]: null,
        updatedAt: new Date(),
      },
    }
  );

  return {
    matched: result.matchedCount,
    updated: result.modifiedCount,
  };
}

async function run() {
  const client = await clientPromise;
  const database = client.db(DATABASE_NAME);
  const usersCollection = database.collection("users");

  try {
    const [coverImageResult, legacyCoverResult] = await Promise.all([
      cleanField(usersCollection, "coverImage"),
      cleanField(usersCollection, "cover"),
    ]);

    console.info(
      `Invalid default covers cleaned successfully. coverImage matched: ${coverImageResult.matched}, updated: ${coverImageResult.updated}; legacy cover matched: ${legacyCoverResult.matched}, updated: ${legacyCoverResult.updated}.`
    );
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error("Invalid default cover cleanup failed:", error);
  process.exitCode = 1;
});
