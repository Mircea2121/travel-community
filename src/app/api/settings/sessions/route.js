import bcrypt from "bcryptjs";

import {
  getAuthVersion,
} from "../../../utils/auth";
import {
  enforceAccountRateLimit,
  jsonResponse,
  refreshAuthCookie,
} from "../../../utils/accountSecurity";
import { getCurrentUser } from "../../../utils/currentUser";
import { getUsersCollection } from "../../../utils/database";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const user = await getCurrentUser({
      includePassword: true,
    });

    if (!user?.password) {
      return jsonResponse(
        {
          success: false,
          message:
            "Sesiunea nu este validă sau a expirat.",
        },
        401
      );
    }

    const rateLimitResponse =
      await enforceAccountRateLimit({
        request,
        userId: user._id,
        action:
          "settings:revoke-sessions",
        limit: 5,
        windowSeconds: 15 * 60,
      });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        {
          success: false,
          message:
            "Datele trimise nu sunt valide.",
        },
        400
      );
    }

    const currentPassword =
      typeof body?.currentPassword ===
      "string"
        ? body.currentPassword
        : "";

    const passwordIsValid =
      currentPassword &&
      await bcrypt.compare(
        currentPassword,
        user.password
      );

    if (!passwordIsValid) {
      return jsonResponse(
        {
          success: false,
          message:
            "Parola actuală este incorectă.",
        },
        401
      );
    }

    const currentAuthVersion =
      getAuthVersion(user);
    const nextAuthVersion =
      currentAuthVersion + 1;
    const now = new Date();
    const usersCollection =
      await getUsersCollection();

    const authVersionFilter =
      currentAuthVersion === 0
        ? {
            $or: [
              {
                authVersion: 0,
              },
              {
                authVersion: {
                  $exists: false,
                },
              },
            ],
          }
        : {
            authVersion:
              currentAuthVersion,
          };

    const updateResult =
      await usersCollection.updateOne(
        {
          _id: user._id,
          ...authVersionFilter,
        },
        {
          $set: {
            authVersion:
              nextAuthVersion,
            sessionsRevokedAt: now,
            updatedAt: now,
          },
        }
      );

    if (updateResult.matchedCount !== 1) {
      return jsonResponse(
        {
          success: false,
          message:
            "Sesiunile au fost modificate între timp. Reîncarcă pagina și încearcă din nou.",
        },
        409
      );
    }

    await refreshAuthCookie(
      user,
      nextAuthVersion
    );

    return jsonResponse(
      {
        success: true,
        message:
          "Toate celelalte dispozitive au fost deconectate.",
        sessionsRevokedAt: now,
      },
      200
    );
  } catch (error) {
    console.error(
      "Eroare la revocarea sesiunilor:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message:
          "Sesiunile nu au putut fi actualizate momentan.",
      },
      500
    );
  }
}
