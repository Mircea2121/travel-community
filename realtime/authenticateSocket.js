import { parse } from "cookie";
import { ObjectId } from "mongodb";

import {
  getAuthVersion,
  isAuthTokenCurrent,
  verifyToken,
} from "../src/app/utils/auth.js";
import { getUsersCollection } from "../src/app/utils/database.js";

function createAuthenticationError(code, message) {
  const error = new Error(message);

  error.data = {
    code,
  };

  return error;
}

function getTokenFromSocket(socket) {
  const cookieHeader = socket.handshake.headers.cookie;

  if (
    typeof cookieHeader !== "string" ||
    !cookieHeader.trim()
  ) {
    return null;
  }

  try {
    const cookies = parse(cookieHeader);

    return typeof cookies.token === "string"
      ? cookies.token.trim()
      : null;
  } catch {
    return null;
  }
}

export async function authenticateSocket(socket, next) {
  try {
    const token = getTokenFromSocket(socket);

    if (!token) {
      next(
        createAuthenticationError(
          "AUTH_TOKEN_MISSING",
          "Autentificarea este necesară."
        )
      );
      return;
    }

    let payload;

    try {
      payload = await verifyToken(token);
    } catch {
      next(
        createAuthenticationError(
          "AUTH_TOKEN_INVALID",
          "Sesiunea nu mai este validă."
        )
      );
      return;
    }

    const userId =
      typeof payload?.userId === "string"
        ? payload.userId.trim()
        : "";

    if (!ObjectId.isValid(userId)) {
      next(
        createAuthenticationError(
          "AUTH_TOKEN_INVALID",
          "Sesiunea nu mai este validă."
        )
      );
      return;
    }

    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne(
      {
        _id: new ObjectId(userId),
      },
      {
        projection: {
          _id: 1,
          authVersion: 1,
        },
      }
    );

    if (!user) {
      next(
        createAuthenticationError(
          "AUTH_USER_NOT_FOUND",
          "Utilizatorul nu mai există."
        )
      );
      return;
    }

    if (!isAuthTokenCurrent(payload, user)) {
      next(
        createAuthenticationError(
          "AUTH_SESSION_REVOKED",
          "Sesiunea a fost închisă din motive de securitate."
        )
      );
      return;
    }

    socket.data.userId = user._id.toString();
    socket.data.authVersion = getAuthVersion(user);
    socket.data.tokenExpiresAt =
      typeof payload.exp === "number"
        ? payload.exp * 1000
        : null;

    next();
  } catch (error) {
    console.error("Socket authentication error:", error);

    next(
      createAuthenticationError(
        "AUTH_INTERNAL_ERROR",
        "Conexiunea nu a putut fi autentificată."
      )
    );
  }
}
