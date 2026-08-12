import { requireAdmin, adminError, adminJson } from "@/app/utils/admin";
import { getDatabase } from "@/app/utils/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const database = await getDatabase();
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      users,
      newUsersToday,
      suspendedUsers,
      posts,
      postsLast7Days,
      comments,
      pendingReports,
      newSupportRequests,
      conversations,
      messages,
    ] = await Promise.all([
      database.collection("users").countDocuments(),
      database.collection("users").countDocuments({ createdAt: { $gte: startOfDay } }),
      database.collection("users").countDocuments({ accountStatus: "suspended" }),
      database.collection("posts").countDocuments(),
      database.collection("posts").countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      database.collection("comments").countDocuments(),
      database.collection("reports").countDocuments({ status: "pending" }),
      database.collection("supportRequests").countDocuments({ status: "new" }),
      database.collection("conversations").countDocuments(),
      database.collection("messages").countDocuments(),
    ]);

    return adminJson({
      success: true,
      overview: {
        users,
        newUsersToday,
        suspendedUsers,
        posts,
        postsLast7Days,
        comments,
        pendingReports,
        newSupportRequests,
        conversations,
        messages,
        generatedAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/overview error:", error);
    return adminError("Statisticile nu au putut fi încărcate.", 500);
  }
}
