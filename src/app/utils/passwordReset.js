import { createHash, randomBytes } from "node:crypto";

export const PASSWORD_RESET = Object.freeze({
  TOKEN_BYTES: 32,
  TOKEN_LENGTH: 43,
  EXPIRES_IN_MINUTES: 30,
  REQUEST_COOLDOWN_SECONDS: 60,
  MAX_REQUESTS_PER_HOUR: 5,
});

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function normalizePasswordResetToken(token) {
  return typeof token === "string"
    ? token.trim()
    : "";
}

export function isPasswordResetTokenValid(token) {
  const normalizedToken =
    normalizePasswordResetToken(token);

  return (
    normalizedToken.length ===
      PASSWORD_RESET.TOKEN_LENGTH &&
    TOKEN_PATTERN.test(normalizedToken)
  );
}

export function hashPasswordResetToken(token) {
  const normalizedToken =
    normalizePasswordResetToken(token);

  if (!isPasswordResetTokenValid(normalizedToken)) {
    throw new TypeError(
      "Tokenul de resetare nu are un format valid."
    );
  }

  return createHash("sha256")
    .update(normalizedToken, "utf8")
    .digest("hex");
}

export function createPasswordResetToken(now = new Date()) {
  const issuedAt = new Date(now);

  if (Number.isNaN(issuedAt.getTime())) {
    throw new TypeError(
      "Data de emitere a tokenului nu este validă."
    );
  }

  const token = randomBytes(
    PASSWORD_RESET.TOKEN_BYTES
  ).toString("base64url");

  const expiresAt = new Date(
    issuedAt.getTime() +
      PASSWORD_RESET.EXPIRES_IN_MINUTES *
        60 *
        1000
  );

  return {
    token,
    tokenHash: hashPasswordResetToken(token),
    issuedAt,
    expiresAt,
  };
}
