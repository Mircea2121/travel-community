import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

import clientPromise from "../../../utils/mongodb";
import {
  getPasswordResetTokensCollection,
  getUsersCollection,
} from "../../../utils/database";
import { getPasswordValidation } from "../../../utils/validation";
import {
  hashPasswordResetToken,
  isPasswordResetTokenValid,
} from "../../../utils/passwordReset";
import { consumeAuthRateLimit } from "../../../utils/authRateLimit";
import { getRequestClientIp } from "../../../utils/requestClient";

export const runtime = "nodejs";
export const maxDuration = 30;

const INVALID_TOKEN_MESSAGE =
  "Linkul de resetare este invalid, a expirat sau a fost deja folosit.";

class PasswordResetTokenError extends Error {
  constructor() {
    super(INVALID_TOKEN_MESSAGE);
    this.name = "PasswordResetTokenError";
  }
}

function jsonResponse(body, status, additionalHeaders = {}) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      ...additionalHeaders,
    },
  });
}

function invalidTokenResponse() {
  return jsonResponse(
    {
      success: false,
      valid: false,
      message: INVALID_TOKEN_MESSAGE,
    },
    400
  );
}

function getTokenHash(token) {
  if (!isPasswordResetTokenValid(token)) {
    return null;
  }

  return hashPasswordResetToken(token);
}

export async function GET(request) {
  try {
    const token = new URL(request.url).searchParams.get(
      "token"
    );
    const tokenHash = getTokenHash(token);

    if (!tokenHash) {
      return invalidTokenResponse();
    }

    const passwordResetTokensCollection =
      await getPasswordResetTokensCollection();
    const resetToken =
      await passwordResetTokensCollection.findOne(
        {
          tokenHash,
          expiresAt: {
            $gt: new Date(),
          },
        },
        {
          projection: {
            _id: 1,
          },
        }
      );

    if (!resetToken) {
      return invalidTokenResponse();
    }

    return jsonResponse(
      {
        success: true,
        valid: true,
      },
      200
    );
  } catch (error) {
    console.error(
      "Password reset token validation failed:",
      error
    );

    return jsonResponse(
      {
        success: false,
        valid: false,
        message:
          "Linkul nu a putut fi verificat momentan. Încearcă din nou.",
      },
      500
    );
  }
}

export async function POST(request) {
  let session = null;

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

    const token =
      typeof body?.token === "string"
        ? body.token.trim()
        : "";
    const password =
      typeof body?.password === "string"
        ? body.password
        : "";
    const confirmPassword =
      typeof body?.confirmPassword === "string"
        ? body.confirmPassword
        : "";
    const tokenHash = getTokenHash(token);

    if (!tokenHash) {
      return invalidTokenResponse();
    }

    if (password !== confirmPassword) {
      return jsonResponse(
        {
          success: false,
          message: "Parolele introduse nu coincid.",
        },
        400
      );
    }

    const passwordValidation =
      getPasswordValidation(password);

    if (!passwordValidation.isValid) {
      return jsonResponse(
        {
          success: false,
          message:
            "Parola trebuie să aibă între 8 și 64 de caractere, maximum 72 de octeți, o literă mare, o literă mică, o cifră și caracterul @.",
        },
        400
      );
    }

    const clientIp = getRequestClientIp(request);
    const [ipRateLimit, tokenRateLimit] =
      await Promise.all([
        consumeAuthRateLimit({
          action: "password-reset-submit:ip",
          identifier: clientIp,
          limit: 30,
          windowSeconds: 60 * 60,
        }),
        consumeAuthRateLimit({
          action: "password-reset-submit:token",
          identifier: tokenHash,
          limit: 5,
          windowSeconds: 15 * 60,
        }),
      ]);

    const blockedLimit = [
      ipRateLimit,
      tokenRateLimit,
    ].find((rateLimit) => !rateLimit.allowed);

    if (blockedLimit) {
      return jsonResponse(
        {
          success: false,
          message:
            "Ai trimis prea multe încercări. Încearcă din nou mai târziu.",
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

    const passwordResetTokensCollection =
      await getPasswordResetTokensCollection();
    const usersCollection = await getUsersCollection();
    const now = new Date();
    const resetToken =
      await passwordResetTokensCollection.findOne(
        {
          tokenHash,
          expiresAt: {
            $gt: now,
          },
        },
        {
          projection: {
            _id: 1,
            userId: 1,
          },
        }
      );

    if (!resetToken) {
      return invalidTokenResponse();
    }

    const user = await usersCollection.findOne(
      {
        _id: resetToken.userId,
      },
      {
        projection: {
          _id: 1,
          password: 1,
        },
      }
    );

    if (!user?.password) {
      return invalidTokenResponse();
    }

    const passwordWasAlreadyUsed = await bcrypt.compare(
      password,
      user.password
    );

    if (passwordWasAlreadyUsed) {
      return jsonResponse(
        {
          success: false,
          message:
            "Noua parolă trebuie să fie diferită de parola actuală.",
        },
        400
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const client = await clientPromise;

    session = client.startSession();

    await session.withTransaction(
      async () => {
        const transactionTime = new Date();
        const activeResetToken =
          await passwordResetTokensCollection.findOne(
            {
              _id: resetToken._id,
              tokenHash,
              expiresAt: {
                $gt: transactionTime,
              },
            },
            {
              projection: {
                _id: 1,
                userId: 1,
              },
              session,
            }
          );

        if (!activeResetToken) {
          throw new PasswordResetTokenError();
        }

        const updateResult = await usersCollection.updateOne(
          {
            _id: activeResetToken.userId,
          },
          {
            $set: {
              password: hashedPassword,
              passwordChangedAt: transactionTime,
              updatedAt: transactionTime,
            },
            $inc: {
              authVersion: 1,
            },
          },
          {
            session,
          }
        );

        if (updateResult.matchedCount !== 1) {
          throw new PasswordResetTokenError();
        }

        await passwordResetTokensCollection.deleteMany(
          {
            userId: activeResetToken.userId,
          },
          {
            session,
          }
        );
      },
      {
        readConcern: {
          level: "snapshot",
        },
        writeConcern: {
          w: "majority",
        },
        readPreference: "primary",
      }
    );

    const cookieStore = await cookies();

    cookieStore.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return jsonResponse(
      {
        success: true,
        message:
          "Parola a fost schimbată. Te poți autentifica folosind noua parolă.",
      },
      200
    );
  } catch (error) {
    if (error instanceof PasswordResetTokenError) {
      return invalidTokenResponse();
    }

    console.error("Password reset failed:", error);

    return jsonResponse(
      {
        success: false,
        message:
          "Parola nu a putut fi schimbată momentan. Încearcă din nou.",
      },
      500
    );
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
