import {
  adminError,
  adminJson,
  parseLimit,
  parsePage,
  requireAdmin,
  serializeValue,
} from "@/app/utils/admin";
import { getPostsCollection } from "@/app/utils/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const params = new URL(request.url).searchParams;
    const page = parsePage(params.get("page"));
    const limit = parseLimit(params.get("limit"));
    const collection = await getPostsCollection();
    const projection = {
      _id: 1,
      authorId: 1,
      authorUsername: 1,
      title: 1,
      destination: 1,
      country: 1,
      category: 1,
      createdAt: 1,
      updatedAt: 1,
    };
    const [items, total] = await Promise.all([
      collection
        .find({}, { projection })
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      collection.countDocuments(),
    ]);

    return adminJson({
      success: true,
      posts: serializeValue(items),
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/posts error:", error);
    return adminError("Postările nu au putut fi încărcate.", 500);
  }
}
