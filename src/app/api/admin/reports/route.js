import {
  REPORT_STATUSES,
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
    const status = params.get("status")?.trim() || "pending";
    const targetType = params.get("targetType")?.trim() || "";

    if (status !== "all" && !REPORT_STATUSES.includes(status)) {
      return adminError("Statusul raportului nu este valid.", 400);
    }

    const filter = {};
    if (status !== "all") filter.status = status;
    if (targetType) filter.targetType = targetType;

    const collection = (await getDatabase()).collection("reports");
    const [items, total] = await Promise.all([
      collection.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    return adminJson({
      success: true,
      reports: serializeValue(items),
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    console.error("GET /api/admin/reports error:", error);
    return adminError("Raportările nu au putut fi încărcate.", 500);
  }
}
