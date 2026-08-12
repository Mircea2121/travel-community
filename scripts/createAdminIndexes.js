import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI?.trim();
if (!uri) throw new Error("MONGODB_URI lipsește.");
const client = new MongoClient(uri);

try {
  await client.connect();
  const db = client.db("travel-community");
  await Promise.all([
    db.collection("users").createIndex({ accountStatus: 1, createdAt: -1 }, { name: "admin_users_by_status" }),
    db.collection("reports").createIndex({ status: 1, createdAt: -1 }, { name: "admin_reports_queue" }),
    db.collection("supportRequests").createIndex({ status: 1, createdAt: -1 }, { name: "admin_support_queue" }),
    db.collection("adminAuditLogs").createIndex({ createdAt: -1 }, { name: "admin_audit_recent" }),
    db.collection("adminAuditLogs").createIndex({ adminId: 1, createdAt: -1 }, { name: "admin_audit_by_admin" }),
    db.collection("adminAuditLogs").createIndex({ targetType: 1, targetId: 1, createdAt: -1 }, { name: "admin_audit_by_target" }),
  ]);
  console.log("Admin panel indexes created successfully.");
} finally { await client.close(); }
