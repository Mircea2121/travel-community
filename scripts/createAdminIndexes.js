import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI?.trim();
if (!uri) throw new Error("MONGODB_URI lipsește.");
const client = new MongoClient(uri);

function sameDocument(left, right) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

async function ensureIndex(collection, specification) {
  let indexes = [];
  try {
    indexes = await collection.indexes();
  } catch (error) {
    if (error?.code !== 26) throw error;
  }

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
  const db = client.db("travel-community");
  const specifications = [
    ["users", { key: { accountStatus: 1, createdAt: -1 }, name: "admin_users_by_status" }],
    ["reports", { key: { status: 1, createdAt: -1 }, name: "admin_reports_queue" }],
    ["supportRequests", { key: { status: 1, createdAt: -1 }, name: "admin_support_queue" }],
    ["adminAuditLogs", { key: { createdAt: -1 }, name: "admin_audit_recent" }],
    ["adminAuditLogs", { key: { adminId: 1, createdAt: -1 }, name: "admin_audit_by_admin" }],
    ["adminAuditLogs", { key: { targetType: 1, targetId: 1, createdAt: -1 }, name: "admin_audit_by_target" }],
  ];

  for (const [collectionName, specification] of specifications) {
    await ensureIndex(db.collection(collectionName), specification);
  }
  console.log("Admin panel indexes created successfully.");
} finally { await client.close(); }
