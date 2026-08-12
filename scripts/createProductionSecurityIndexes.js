import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI?.trim();

if (!uri) {
  throw new Error("MONGODB_URI lipsește.");
}

const client = new MongoClient(uri);

try {
  await client.connect();
  const database = client.db("travel-community");

  await database.collection("emailVerificationTokens").createIndexes([
    {
      key: { tokenHash: 1 },
      name: "email_verification_token_unique",
      unique: true,
    },
    {
      key: { userId: 1 },
      name: "email_verification_user",
    },
    {
      key: { expiresAt: 1 },
      name: "email_verification_ttl",
      expireAfterSeconds: 0,
    },
  ]);

  await database.collection("authRateLimits").createIndexes([
    {
      key: { key: 1 },
      name: "auth_rate_limit_key_unique",
      unique: true,
    },
    {
      key: { expiresAt: 1 },
      name: "auth_rate_limit_ttl",
      expireAfterSeconds: 0,
    },
  ]);

  await database.collection("users").createIndex(
    { emailVerifiedAt: 1 },
    {
      name: "users_email_verification",
      partialFilterExpression: { emailVerifiedAt: { $type: "date" } },
    }
  );

  console.log("Production security indexes created successfully.");
} finally {
  await client.close();
}

