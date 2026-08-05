import { after } from "next/server";

import {
  getPasswordResetTokensCollection,
  getUsersCollection,
} from "../../../utils/database";
import { EMAIL_PATTERN } from "../../../utils/validation";
import {
  PASSWORD_RESET,
  createPasswordResetToken,
} from "../../../utils/passwordReset";
import { consumeAuthRateLimit } from "../../../utils/authRateLimit";
import { getRequestClientIp } from "../../../utils/requestClient";
import { sendPasswordResetEmail } from "../../../utils/passwordResetEmail";

export const runtime = "nodejs";
export const maxDuration = 30;

const GENERIC_SUCCESS_MESSAGE =
  "Dacă există un cont asociat acestei adrese, vei primi în curând un email cu instrucțiunile de resetare.";

const RATE_LIMIT_MESSAGE =
  "Ai trimis prea multe solicitări. Te rugăm să încerci din nou mai târziu.";

function jsonResponse(body, status, additionalHeaders = {}) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      ...additionalHeaders,
    },
  });
}

function schedulePasswordResetEmail(user) {
  after(async () => {
    let passwordResetTokensCollection = null;
    let tokenHash = null;

    try {
      passwordResetTokensCollection =
        await getPasswordResetTokensCollection();

      const resetToken = createPasswordResetToken();

      tokenHash = resetToken.tokenHash;

      await passwordResetTokensCollection.deleteMany({
        userId: user._id,
      });

      await passwordResetTokensCollection.insertOne({
        userId: user._id,
        tokenHash: resetToken.tokenHash,
        createdAt: resetToken.issuedAt,
        expiresAt: resetToken.expiresAt,
      });

      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        token: resetToken.token,
      });
    } catch (error) {
      if (passwordResetTokensCollection && tokenHash) {
        await passwordResetTokensCollection
          .deleteOne({
            tokenHash,
          })
          .catch(() => {});
      }

      console.error(
        "Password reset email delivery failed:",
        {
          userId: user._id.toString(),
          error,
        }
      );
    }
  });
}

export async function POST(request) {
  try {
    let body;

    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        {
          success: false,
          message: "Cererea trimisă nu este validă.",
        },
        400
      );
    }

    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (
      !email ||
      email.length > 254 ||
      !EMAIL_PATTERN.test(email)
    ) {
      return jsonResponse(
        {
          success: false,
          message: "Introdu o adresă de email validă.",
        },
        400
      );
    }

    const clientIp = getRequestClientIp(request);

    const [
      emailHourlyLimit,
      emailCooldownLimit,
      ipHourlyLimit,
    ] = await Promise.all([
      consumeAuthRateLimit({
        action: "password-reset:email-hour",
        identifier: email,
        limit: PASSWORD_RESET.MAX_REQUESTS_PER_HOUR,
        windowSeconds: 60 * 60,
      }),
      consumeAuthRateLimit({
        action: "password-reset:email-cooldown",
        identifier: email,
        limit: 1,
        windowSeconds:
          PASSWORD_RESET.REQUEST_COOLDOWN_SECONDS,
      }),
      consumeAuthRateLimit({
        action: "password-reset:ip-hour",
        identifier: clientIp,
        limit: 20,
        windowSeconds: 60 * 60,
      }),
    ]);

    const blockedLimit = [
      emailHourlyLimit,
      emailCooldownLimit,
      ipHourlyLimit,
    ].find((rateLimit) => !rateLimit.allowed);

    if (blockedLimit) {
      return jsonResponse(
        {
          success: false,
          message: RATE_LIMIT_MESSAGE,
          retryAfterSeconds:
            blockedLimit.retryAfterSeconds,
        },
        429,
        {
          "Retry-After": String(
            blockedLimit.retryAfterSeconds
          ),
        }
      );
    }

    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne(
      {
        email,
      },
      {
        projection: {
          _id: 1,
          name: 1,
          email: 1,
        },
      }
    );

    if (user) {
      schedulePasswordResetEmail(user);
    }

    return jsonResponse(
      {
        success: true,
        message: GENERIC_SUCCESS_MESSAGE,
      },
      200
    );
  } catch (error) {
    console.error(
      "Password reset request failed:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message:
          "Solicitarea nu a putut fi procesată momentan. Încearcă din nou.",
      },
      500
    );
  }
}