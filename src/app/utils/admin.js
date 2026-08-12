import "server-only";

import { ObjectId } from "mongodb";

import { USER_ROLES } from "./constants";
import { getCurrentUser } from "./currentUser";
import { getDatabase } from "./database";

export const ACCOUNT_STATUSES = Object.freeze({
  ACTIVE: "active",
  SUSPENDED: "suspended",
});

export const REPORT_STATUSES = Object.freeze([
  "pending",
  "reviewing",
  "resolved",
  "dismissed",
]);

export const SUPPORT_STATUSES = Object.freeze([
  "new",
  "in_progress",
  "resolved",
  "closed",
]);

export function adminJson(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}

export function adminError(message, status, code = "ADMIN_ERROR") {
  return adminJson({ success: false, code, message }, status);
}

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user?._id) {
    return {
      error: adminError(
        "Trebuie să fii autentificat.",
        401,
        "AUTH_REQUIRED"
      ),
      user: null,
    };
  }

  if (user.role !== USER_ROLES.ADMIN) {
    return {
      error: adminError(
        "Nu ai permisiunea de a accesa această zonă.",
        403,
        "ADMIN_REQUIRED"
      ),
      user: null,
    };
  }

  return { error: null, user };
}

export function parseObjectId(value) {
  const normalized = String(value || "").trim();
  return ObjectId.isValid(normalized) ? new ObjectId(normalized) : null;
}

export function parseLimit(value, fallback = 20, maximum = 50) {
  const number = Number(value);
  return Number.isInteger(number)
    ? Math.min(Math.max(number, 1), maximum)
    : fallback;
}

export function parsePage(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 1;
}

export function serializeValue(value) {
  if (value instanceof ObjectId) return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, serializeValue(entry)])
    );
  }
  return value;
}

export async function writeAdminAudit({
  admin,
  action,
  targetType,
  targetId,
  metadata = {},
}) {
  const database = await getDatabase();
  await database.collection("adminAuditLogs").insertOne({
    adminId: admin._id,
    adminUsername: admin.username || "",
    action,
    targetType,
    targetId: parseObjectId(targetId) || String(targetId || ""),
    metadata,
    createdAt: new Date(),
  });
}
