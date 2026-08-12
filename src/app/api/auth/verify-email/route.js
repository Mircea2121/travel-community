import { ObjectId } from "mongodb";

import {
  getEmailVerificationTokensCollection,
  getUsersCollection,
} from "../../../utils/database";
import { hashEmailVerificationToken } from "../../../utils/emailVerification";
import { jsonResponse } from "../../../utils/securityResponse";
import { isTrustedMutationRequest } from "../../../utils/requestOrigin";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    if (!isTrustedMutationRequest(request)) {
      return jsonResponse(
        { success: false, message: "Originea cererii nu este permisă." },
        403
      );
    }

    const body = await request.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token.trim() : "";

    if (!token || token.length > 256) {
      return jsonResponse(
        { success: false, message: "Linkul de verificare nu este valid." },
        400
      );
    }

    const tokenHash = hashEmailVerificationToken(token);
    const tokensCollection = await getEmailVerificationTokensCollection();
    const verification = await tokensCollection.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    });

    if (!verification || !ObjectId.isValid(verification.userId)) {
      return jsonResponse(
        {
          success: false,
          code: "INVALID_OR_EXPIRED_TOKEN",
          message: "Linkul de verificare este invalid sau a expirat.",
        },
        400
      );
    }

    const usersCollection = await getUsersCollection();
    const now = new Date();
    const update = await usersCollection.updateOne(
      { _id: new ObjectId(verification.userId) },
      {
        $set: {
          emailVerifiedAt: now,
          updatedAt: now,
        },
      }
    );

    if (!update.matchedCount) {
      return jsonResponse(
        { success: false, message: "Contul nu mai există." },
        404
      );
    }

    await tokensCollection.deleteMany({ userId: verification.userId });

    return jsonResponse({
      success: true,
      message: "Adresa de email a fost confirmată.",
    });
  } catch (error) {
    console.error("Email verification failed:", error);
    return jsonResponse(
      { success: false, message: "Verificarea nu a putut fi procesată." },
      500
    );
  }
}

