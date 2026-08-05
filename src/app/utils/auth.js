import { SignJWT, jwtVerify } from "jose";

let encodedSecret = null;

function getJwtSecret() {
  if (encodedSecret) {
    return encodedSecret;
  }

  const secret = process.env.JWT_SECRET?.trim();

  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET trebuie configurat cu minimum 32 de caractere."
    );
  }

  encodedSecret = new TextEncoder().encode(secret);

  return encodedSecret;
}

export function getAuthVersion(value) {
  const authVersion =
    typeof value === "object" && value !== null
      ? value.authVersion
      : value;

  return Number.isSafeInteger(authVersion) &&
    authVersion >= 0
    ? authVersion
    : 0;
}

export function isAuthTokenCurrent(payload, user) {
  if (!payload || !user) {
    return false;
  }

  return (
    getAuthVersion(payload) === getAuthVersion(user)
  );
}

export async function createToken(payload) {
  if (!payload || typeof payload !== "object") {
    throw new TypeError(
      "Datele tokenului de autentificare nu sunt valide."
    );
  }

  return new SignJWT(payload)
    .setProtectedHeader({
      alg: "HS256",
      typ: "JWT",
    })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyToken(token) {
  if (typeof token !== "string" || !token.trim()) {
    throw new TypeError(
      "Tokenul de autentificare lipsește."
    );
  }

  const { payload } = await jwtVerify(
    token.trim(),
    getJwtSecret(),
    {
      algorithms: ["HS256"],
    }
  );

  return payload;
}
