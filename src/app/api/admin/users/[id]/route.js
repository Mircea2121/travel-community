import {
  ACCOUNT_STATUSES,
  adminError,
  adminJson,
  parseObjectId,
  requireAdmin,
  writeAdminAudit,
} from "@/app/utils/admin";
import { USER_ROLES } from "@/app/utils/constants";
import { getUsersCollection } from "@/app/utils/database";

export const runtime = "nodejs";

export async function PATCH(request, { params }) {
  try {
    const { error, user: admin } = await requireAdmin();
    if (error) return error;
    const { id } = await params;
    const userId = parseObjectId(id);
    if (!userId) return adminError("Utilizatorul nu este valid.", 400);
    if (String(userId) === String(admin._id)) {
      return adminError("Nu îți poți suspenda propriul cont.", 400);
    }

    let body;
    try { body = await request.json(); } catch {
      return adminError("Cererea nu este validă.", 400);
    }
    const action = String(body?.action || "").trim();
    const reason = String(body?.reason || "").trim().slice(0, 500);
    if (!['suspend', 'reactivate'].includes(action)) {
      return adminError("Acțiunea nu este validă.", 400);
    }
    if (action === "suspend" && reason.length < 5) {
      return adminError("Introdu un motiv de cel puțin 5 caractere.", 400);
    }

    const collection = await getUsersCollection();
    const target = await collection.findOne(
      { _id: userId },
      { projection: { role: 1, accountStatus: 1 } }
    );
    if (!target) return adminError("Utilizatorul nu a fost găsit.", 404);
    if (target.role === USER_ROLES.ADMIN) {
      return adminError("Conturile de administrator nu pot fi suspendate din această interfață.", 403);
    }

    const now = new Date();
    const suspended = action === "suspend";
    await collection.updateOne(
      { _id: userId },
      {
        $set: {
          accountStatus: suspended ? ACCOUNT_STATUSES.SUSPENDED : ACCOUNT_STATUSES.ACTIVE,
          suspensionReason: suspended ? reason : "",
          suspendedAt: suspended ? now : null,
          suspendedBy: suspended ? admin._id : null,
          updatedAt: now,
        },
        $inc: { authVersion: 1 },
      }
    );

    await writeAdminAudit({
      admin,
      action: suspended ? "user.suspended" : "user.reactivated",
      targetType: "user",
      targetId: userId,
      metadata: { reason },
    });
    return adminJson({
      success: true,
      message: suspended ? "Contul a fost suspendat." : "Contul a fost reactivat.",
    });
  } catch (error) {
    console.error("PATCH /api/admin/users/[id] error:", error);
    return adminError("Contul nu a putut fi actualizat.", 500);
  }
}
