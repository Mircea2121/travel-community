import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

import { getUsersCollection } from "../../../utils/database";
import { EMAIL_PATTERN } from "../../../utils/validation";
import { createToken, getAuthVersion } from "../../../utils/auth";
import { consumeAuthRateLimit } from "../../../utils/authRateLimit";
import { getRequestClientIp } from "../../../utils/requestClient";
import { isTrustedMutationRequest } from "../../../utils/requestOrigin";
import {
  jsonResponse,
  rateLimitResponse,
} from "../../../utils/securityResponse";
import { verifyTurnstile } from "../../../utils/turnstile";

export const runtime = "nodejs";

const LOGIN_WINDOW_SECONDS = 15 * 60;

function invalidCredentialsResponse() {
  return jsonResponse(
    {
      success: false,
      message: "Emailul sau parola sunt incorecte.",
    },
    401
  );
}

export async function POST(request) {
  try {
    if (!isTrustedMutationRequest(request)) {
      return jsonResponse(
        {
          success: false,
          message: "Originea cererii nu este permisă.",
        },
        403
      );
    }

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
    const password =
      typeof body?.password === "string" ? body.password : "";
    const clientIp = getRequestClientIp(request);

    const ipRateLimit = await consumeAuthRateLimit({
      action: "login:ip",
      identifier: clientIp,
      limit: 30,
      windowSeconds: LOGIN_WINDOW_SECONDS,
    });

    if (!ipRateLimit.allowed) {
      return rateLimitResponse(ipRateLimit);
    }

    if (!email || !password) {
      return jsonResponse(
        {
          success: false,
          message: "Emailul și parola sunt obligatorii.",
        },
        400
      );
    }

    if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
      return jsonResponse(
        {
          success: false,
          message: "Adresa de email nu este validă.",
        },
        400
      );
    }

    if (password.length > 256) {
      return invalidCredentialsResponse();
    }

    const accountRateLimit = await consumeAuthRateLimit({
      action: "login:account",
      identifier: email,
      limit: 15,
      windowSeconds: LOGIN_WINDOW_SECONDS,
    });

    if (!accountRateLimit.allowed) {
      return rateLimitResponse(accountRateLimit);
    }

    const turnstile = await verifyTurnstile({
      token: body?.turnstileToken,
      remoteIp: clientIp,
      action: "login",
    });

    if (!turnstile.success) {
      return jsonResponse(
        {
          success: false,
          code: "SECURITY_CHECK_FAILED",
          message:
            "Verificarea de securitate a expirat sau nu a reușit. Încearcă din nou.",
        },
        400
      );
    }

    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne(
      { email },
      {
        projection: {
          _id: 1,
          name: 1,
          username: 1,
          email: 1,
          password: 1,
          role: 1,
          authVersion: 1,
          accountStatus: 1,
          emailVerifiedAt: 1,
        },
      }
    );

    if (!user?.password) {
      await bcrypt.compare(
        password,
        "$2b$12$ZQ4bWpQmbnHIWjzrD8lC0O3k9I3FF7vQx3T3oA/vePZwKkHhlyF4q"
      );
      return invalidCredentialsResponse();
    }

    const passwordIsCorrect = await bcrypt.compare(password, user.password);

    if (!passwordIsCorrect) {
      return invalidCredentialsResponse();
    }

    if (user.accountStatus === "suspended") {
      return jsonResponse(
        {
          success: false,
          code: "ACCOUNT_SUSPENDED",
          message:
            "Acest cont este suspendat. Contactează echipa de suport dacă dorești să contești decizia.",
        },
        403
      );
    }

    if (user.emailVerifiedAt === null) {
      return jsonResponse(
        {
          success: false,
          code: "EMAIL_VERIFICATION_REQUIRED",
          message:
            "Confirmă adresa de email înainte de autentificare. Poți cere un link nou din pagina de retrimitere.",
        },
        403
      );
    }

    const token = await createToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      authVersion: getAuthVersion(user),
    });

    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return jsonResponse(
      {
        success: true,
        message: "Autentificarea a fost realizată cu succes.",
        user: {
          id: user._id.toString(),
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          emailVerified: Boolean(user.emailVerifiedAt),
        },
      },
      200
    );
  } catch (error) {
    console.error("Eroare la autentificare:", error);
    return jsonResponse(
      {
        success: false,
        message: "A apărut o eroare la autentificare.",
      },
      500
    );
  }
}
