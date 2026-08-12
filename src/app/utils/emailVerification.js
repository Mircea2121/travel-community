import { createHash, randomBytes } from "node:crypto";

export const EMAIL_VERIFICATION = Object.freeze({
  TOKEN_BYTES: 32,
  TOKEN_TTL_MILLISECONDS: 24 * 60 * 60 * 1000,
});

export function hashEmailVerificationToken(token) {
  if (typeof token !== "string" || !token.trim()) {
    throw new TypeError("Tokenul de verificare lipsește.");
  }

  return createHash("sha256").update(token.trim(), "utf8").digest("hex");
}

export function createEmailVerificationToken(now = new Date()) {
  const issuedAt = new Date(now);

  if (Number.isNaN(issuedAt.getTime())) {
    throw new TypeError("Data emiterii tokenului nu este validă.");
  }

  const token = randomBytes(EMAIL_VERIFICATION.TOKEN_BYTES).toString("hex");

  return {
    token,
    tokenHash: hashEmailVerificationToken(token),
    issuedAt,
    expiresAt: new Date(
      issuedAt.getTime() + EMAIL_VERIFICATION.TOKEN_TTL_MILLISECONDS
    ),
  };
}

