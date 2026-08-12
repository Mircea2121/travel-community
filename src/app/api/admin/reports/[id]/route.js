import {
  REPORT_STATUSES,
  adminError,
  adminJson,
  parseObjectId,
  requireAdmin,
  writeAdminAudit,
} from "@/app/utils/admin";
import { getDatabase } from "@/app/utils/database";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  try {
    const { error, user: admin } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const reportId = parseObjectId(id);
    if (!reportId) return adminError("Raportarea nu este validă.", 400);

    let body;
    try { body = await request.json(); } catch {
      return adminError("Cererea nu este validă.", 400);
    }

    const status = String(body?.status || "").trim();
    const resolution = String(body?.resolution || "").trim().slice(0, 1000);
    if (!REPORT_STATUSES.includes(status) || status === "pending") {
      return adminError("Selectează un status valid.", 400);
    }
    if ((status === "resolved" || status === "dismissed") && resolution.length < 3) {
      return adminError("Adaugă o explicație pentru soluționare.", 400);
    }

    const collection = (await getDatabase()).collection("reports");
    const now = new Date();
    const result = await collection.findOneAndUpdate(
      { _id: reportId },
      { $set: {
        status,
        resolution,
        reviewedBy: admin._id,
        reviewedAt: now,
        updatedAt: now,
      } },
      { returnDocument: "after" }
    );
    if (!result) return adminError("Raportarea nu a fost găsită.", 404);

    await writeAdminAudit({
      admin,
      action: "report.status_updated",
      targetType: "report",
      targetId: reportId,
      metadata: { status, resolution },
    });

    return adminJson({ success: true, message: "Raportarea a fost actualizată." });
  } catch (error) {
    console.error("PATCH /api/admin/reports/[id] error:", error);
    return adminError("Raportarea nu a putut fi actualizată.", 500);
  }
}
