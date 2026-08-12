import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI?.trim();

if (!uri) {
  throw new Error("MONGODB_URI lipsește.");
}

const client = new MongoClient(uri);

try {
  await client.connect();
  const users = client.db("travel-community").collection("users");
  const now = new Date();
  const result = await users.updateMany(
    { emailVerifiedAt: { $exists: false } },
    {
      $set: {
        emailVerifiedAt: now,
        emailVerificationMigratedAt: now,
      },
    }
  );

  console.log(
    `Existing users marked as verified: ${result.modifiedCount}. New accounts still require email verification.`
  );
} finally {
  await client.close();
}

