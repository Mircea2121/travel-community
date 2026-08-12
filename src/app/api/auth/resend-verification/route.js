import { ObjectId } from "mongodb";

import { getUsersCollection } from "../../../utils/database";
import { consumeAuthRateLimit } from "../../../utils/authRateLimit";
import { getRequestClientIp } from "../../../utils/requestClient";
import { isTrustedMutationRequest } from "../../../utils/requestOrigin";
import {
  jsonResponse,
  rateLimitResponse,
} from "../../../utils/securityResponse";
import { scheduleEmailVerification } from "../../../utils/scheduleEmailVerification";
import { EMAIL_PATTERN } from "../../../utils/validation";

export const runtime = "nodejs";
export const maxDuration = 30;

const GENERIC_MESSAGE =
  "Dacă adresa aparține unui cont neconfirmat, vei primi un email în curând.";

export async function POST(request) {
  try {
    if (!isTrustedMutationRequest(request)) {
      return jsonResponse(
        { success: false, message: "Originea cererii nu este permisă." },
        403
      );
    }

    const body = await request.json().catch(() => null);
    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
      return jsonResponse({ success: true, message: GENERIC_MESSAGE });
    }

    const clientIp = getRequestClientIp(request);
    const ipRateLimit = await consumeAuthRateLimit({
      action: "verify-email-resend:ip",
      identifier: clientIp,
      limit: 10,
      windowSeconds: 60 * 60,
    });

    if (!ipRateLimit.allowed) {
      return rateLimitResponse(ipRateLimit);
    }

    const emailRateLimit = await consumeAuthRateLimit({
      action: "verify-email-resend:email",
      identifier: email,
      limit: 3,
      windowSeconds: 60 * 60,
    });

    if (!emailRateLimit.allowed) {
      return jsonResponse({ success: true, message: GENERIC_MESSAGE });
    }

    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne(
      { email },
      {
        projection: {
          _id: 1,
          name: 1,
          email: 1,
          emailVerifiedAt: 1,
        },
      }
    );

    if (
      user &&
      ObjectId.isValid(user._id) &&
      !user.emailVerifiedAt
    ) {
      scheduleEmailVerification(user);
    }

    return jsonResponse({ success: true, message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("Resend verification failed:", error);
    return jsonResponse(
      { success: false, message: "Cererea nu a putut fi procesată." },
      500
    );
  }
}

