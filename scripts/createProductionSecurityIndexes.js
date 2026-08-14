import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI?.trim();

if (!uri) {
  throw new Error("MONGODB_URI lipsește.");
}

const client = new MongoClient(uri);

function sameDocument(left, right) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

async function ensureIndex(collection, specification) {
  const indexes = await collection.indexes();
  const equivalent = indexes.find(
    (index) =>
      sameDocument(index.key, specification.key) &&
      Boolean(index.unique) === Boolean(specification.unique) &&
      (index.expireAfterSeconds ?? null) ===
        (specification.expireAfterSeconds ?? null) &&
      sameDocument(
        index.partialFilterExpression,
        specification.partialFilterExpression
      )
  );

  if (equivalent) {
    console.log(
      `Index ${specification.name} already satisfied by ${equivalent.name}.`
    );
    return equivalent.name;
  }

  return collection.createIndex(specification.key, specification);
}

try {
  await client.connect();
  const database = client.db("travel-community");

  const emailVerificationTokens = database.collection(
    "emailVerificationTokens"
  );
  const authRateLimits = database.collection("authRateLimits");
  const users = database.collection("users");

  for (const specification of [
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
  ]) {
    await ensureIndex(emailVerificationTokens, specification);
  }

  for (const specification of [
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
  ]) {
    await ensureIndex(authRateLimits, specification);
  }

  await ensureIndex(users, {
      key: { emailVerifiedAt: 1 },
      name: "users_email_verification",
      partialFilterExpression: { emailVerifiedAt: { $type: "date" } },
  });

  console.log("Production security indexes created successfully.");
} finally {
  await client.close();
}

