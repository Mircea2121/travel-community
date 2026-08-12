import {
  adminError,
  adminJson,
  parseLimit,
  parsePage,
  requireAdmin,
  serializeValue,
} from "@/app/utils/admin";
import { getDatabase } from "@/app/utils/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;
    const params = new URL(request.url).searchParams;
    const page = parsePage(params.get("page"));
    const limit = parseLimit(params.get("limit"));
    const collection = (await getDatabase()).collection("adminAuditLogs");
    const [items, total] = await Promise.all([
      collection.find({}).sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit).limit(limit).toArray(),
      collection.countDocuments(),
    ]);
    return adminJson({
      success: true,
      logs: serializeValue(items),
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    console.error("GET /api/admin/audit error:", error);
    return adminError("Jurnalul nu a putut fi încărcat.", 500);
  }
}
