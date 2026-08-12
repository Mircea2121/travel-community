import {
  SUPPORT_STATUSES,
  adminError,
  adminJson,
  parseObjectId,
  requireAdmin,
  writeAdminAudit,
} from "@/app/utils/admin";
import { getSupportRequestsCollection } from "@/app/utils/database";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  try {
    const { error, user: admin } = await requireAdmin();
    if (error) return error;
    const { id } = await params;
    const requestId = parseObjectId(id);
    if (!requestId) return adminError("Solicitarea nu este validă.", 400);

    let body;
    try { body = await request.json(); } catch {
      return adminError("Cererea nu este validă.", 400);
    }
    const status = String(body?.status || "").trim();
    const internalNote = String(body?.internalNote || "").trim().slice(0, 2000);
    if (!SUPPORT_STATUSES.includes(status)) {
      return adminError("Selectează un status valid.", 400);
    }

    const collection = await getSupportRequestsCollection();
    const now = new Date();
    const result = await collection.updateOne(
      { _id: requestId },
      { $set: {
        status,
        internalNote,
        assignedTo: admin._id,
        resolvedAt: status === "resolved" || status === "closed" ? now : null,
        updatedAt: now,
      } }
    );
    if (!result.matchedCount) return adminError("Solicitarea nu a fost găsită.", 404);

    await writeAdminAudit({
      admin,
      action: "support.status_updated",
      targetType: "supportRequest",
      targetId: requestId,
      metadata: { status, internalNote },
    });
    return adminJson({ success: true, message: "Solicitarea a fost actualizată." });
  } catch (error) {
    console.error("PATCH /api/admin/support/[id] error:", error);
    return adminError("Solicitarea nu a putut fi actualizată.", 500);
  }
}
