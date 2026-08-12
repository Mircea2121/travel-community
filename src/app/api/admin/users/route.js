import {
  adminError,
  adminJson,
  parseLimit,
  parsePage,
  requireAdmin,
  serializeValue,
} from "@/app/utils/admin";
import { getUsersCollection } from "@/app/utils/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;
    const params = new URL(request.url).searchParams;
    const page = parsePage(params.get("page"));
    const limit = parseLimit(params.get("limit"));
    const query = String(params.get("q") || "").trim().slice(0, 100);
    const status = String(params.get("status") || "all").trim();

    const conditions = [];

    if (query) {
      const regex = new RegExp(escapeRegex(query), "i");
      conditions.push({
        $or: [{ name: regex }, { username: regex }, { email: regex }],
      });
    }

    if (status === "active") {
      conditions.push({
        $or: [
          { accountStatus: "active" },
          { accountStatus: { $exists: false } },
        ],
      });
    } else if (status === "suspended") {
      conditions.push({ accountStatus: "suspended" });
    }

    const filter = conditions.length > 0 ? { $and: conditions } : {};

    const collection = await getUsersCollection();
    const projection = {
      password: 0,
      authVersion: 0,
      passwordChangedAt: 0,
      sessionsRevokedAt: 0,
    };
    const [items, total] = await Promise.all([
      collection.find(filter, { projection }).sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit).limit(limit).toArray(),
      collection.countDocuments(filter),
    ]);

    return adminJson({
      success: true,
      users: serializeValue(items),
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return adminError("Utilizatorii nu au putut fi încărcați.", 500);
  }
}
