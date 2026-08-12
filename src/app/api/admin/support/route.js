import {
  SUPPORT_STATUSES,
  adminError,
  adminJson,
  parseLimit,
  parsePage,
  requireAdmin,
  serializeValue,
} from "@/app/utils/admin";
import { getSupportRequestsCollection } from "@/app/utils/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const params = new URL(request.url).searchParams;
    const page = parsePage(params.get("page"));
    const limit = parseLimit(params.get("limit"));
    const status = params.get("status")?.trim() || "new";
    if (status !== "all" && !SUPPORT_STATUSES.includes(status)) {
      return adminError("Statusul solicitării nu este valid.", 400);
    }

    const filter = status === "all" ? {} : { status };
    const collection = await getSupportRequestsCollection();
    const [items, total] = await Promise.all([
      collection.find(filter).sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit).limit(limit).toArray(),
      collection.countDocuments(filter),
    ]);

    return adminJson({
      success: true,
      requests: serializeValue(items),
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    console.error("GET /api/admin/support error:", error);
    return adminError("Solicitările nu au putut fi încărcate.", 500);
  }
}
