import "server-only";

import { cookies } from "next/headers";

import {
  createToken,
  getAuthVersion,
} from "./auth";
import { consumeAuthRateLimit } from "./authRateLimit";

const AUTH_COOKIE_MAX_AGE =
  60 * 60 * 24 * 7;

function getClientAddress(request) {
  const forwardedFor = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();

  return (
    forwardedFor ||
    request.headers
      .get("x-real-ip")
      ?.trim() ||
    "unknown"
  );
}

export function jsonResponse(
  body,
  status,
  headers = {}
) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control":
        "no-store, max-age=0",
      ...headers,
    },
  });
}

export async function enforceAccountRateLimit({
  request,
  userId,
  action,
  limit = 5,
  windowSeconds = 15 * 60,
}) {
  const rateLimit =
    await consumeAuthRateLimit({
      action,
      identifier: `${String(
        userId
      )}:${getClientAddress(request)}`,
      limit,
      windowSeconds,
    });

  if (rateLimit.allowed) {
    return null;
  }

  return jsonResponse(
    {
      success: false,
      code: "RATE_LIMITED",
      message:
        "Ai făcut prea multe încercări. Încearcă din nou mai târziu.",
      retryAfterSeconds:
        rateLimit.retryAfterSeconds,
    },
    429,
    {
      "Retry-After": String(
        rateLimit.retryAfterSeconds
      ),
    }
  );
}

export async function refreshAuthCookie(
  user,
  authVersion = getAuthVersion(user)
) {
  const token = await createToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    authVersion,
  });

  const cookieStore = await cookies();

  cookieStore.set("token", token, {
    httpOnly: true,
    secure:
      process.env.NODE_ENV ===
      "production",
    sameSite: "lax",
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();

  cookieStore.set("token", "", {
    httpOnly: true,
    secure:
      process.env.NODE_ENV ===
      "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}
