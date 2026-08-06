import bcrypt from "bcryptjs";

import { getCurrentUser } from "../../../utils/currentUser";
import {
  getPasswordResetTokensCollection,
  getUsersCollection,
} from "../../../utils/database";
import {
  getAuthVersion,
} from "../../../utils/auth";
import {
  enforceAccountRateLimit,
  jsonResponse,
  refreshAuthCookie,
} from "../../../utils/accountSecurity";
import {
  getPasswordValidation,
} from "../../../utils/validation";

export const runtime = "nodejs";

export async function PUT(request) {
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
          "settings:change-password",
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
    const newPassword =
      typeof body?.newPassword ===
      "string"
        ? body.newPassword
        : "";
    const confirmPassword =
      typeof body?.confirmPassword ===
      "string"
        ? body.confirmPassword
        : "";

    if (!currentPassword) {
      return jsonResponse(
        {
          success: false,
          message:
            "Introdu parola actuală.",
        },
        400
      );
    }

    if (newPassword !== confirmPassword) {
      return jsonResponse(
        {
          success: false,
          message:
            "Parolele noi nu coincid.",
        },
        400
      );
    }

    const passwordValidation =
      getPasswordValidation(newPassword);

    if (!passwordValidation.isValid) {
      return jsonResponse(
        {
          success: false,
          message:
            "Parola nouă trebuie să aibă între 8 și 64 de caractere și să conțină literă mică, literă mare, cifră și caracterul @.",
          rules: passwordValidation.rules,
        },
        400
      );
    }

    const currentPasswordIsValid =
      await bcrypt.compare(
        currentPassword,
        user.password
      );

    if (!currentPasswordIsValid) {
      return jsonResponse(
        {
          success: false,
          message:
            "Parola actuală este incorectă.",
        },
        401
      );
    }

    const passwordWasAlreadyUsed =
      await bcrypt.compare(
        newPassword,
        user.password
      );

    if (passwordWasAlreadyUsed) {
      return jsonResponse(
        {
          success: false,
          message:
            "Parola nouă trebuie să fie diferită de parola actuală.",
        },
        400
      );
    }

    const hashedPassword =
      await bcrypt.hash(newPassword, 12);
    const now = new Date();
    const nextAuthVersion =
      getAuthVersion(user) + 1;
    const usersCollection =
      await getUsersCollection();

    const updateResult =
      await usersCollection.updateOne(
        {
          _id: user._id,
          password: user.password,
        },
        {
          $set: {
            password: hashedPassword,
            passwordChangedAt: now,
            updatedAt: now,
            authVersion:
              nextAuthVersion,
          },
        }
      );

    if (updateResult.matchedCount !== 1) {
      return jsonResponse(
        {
          success: false,
          message:
            "Contul a fost modificat între timp. Reîncarcă pagina și încearcă din nou.",
        },
        409
      );
    }

    const resetTokensCollection =
      await getPasswordResetTokensCollection();

    await resetTokensCollection.deleteMany({
      userId: user._id,
    });

    await refreshAuthCookie(
      user,
      nextAuthVersion
    );

    return jsonResponse(
      {
        success: true,
        message:
          "Parola a fost schimbată. Celelalte sesiuni au fost deconectate.",
        passwordChangedAt: now,
      },
      200
    );
  } catch (error) {
    console.error(
      "Eroare la schimbarea parolei:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message:
          "Parola nu a putut fi schimbată momentan.",
      },
      500
    );
  }
}
