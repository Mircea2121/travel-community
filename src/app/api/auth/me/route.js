import { getCurrentUser } from "../../../utils/currentUser";
import { getProfileStats } from "../../../utils/profileStats";

export const runtime = "nodejs";

function jsonResponse(body, status) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return jsonResponse(
        {
          success: false,
          message:
            "Sesiunea nu este validă sau a expirat.",
        },
        401
      );
    }

    const profileData = await getProfileStats(user._id);

    return jsonResponse(
      {
        success: true,
        user: {
          id: user._id.toString(),

          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,

          bio: user.bio,
          location: user.location,
          nameChangedAt:
            user.nameChangedAt || null,

          avatar: user.avatar,
          coverImage: user.coverImage,

          stats: profileData.stats,
          level: profileData.level,

          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      200
    );
  } catch (error) {
    console.error(
      "Eroare la verificarea sesiunii:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message:
          "Sesiunea nu a putut fi verificată momentan.",
      },
      500
    );
  }
}
