import { createHmac } from "node:crypto";

import { getAuthRateLimitsCollection } from "./database";

const ACTION_PATTERN = /^[a-z0-9:_-]{1,80}$/;

function getRateLimitSecret() {
  const secret =
    process.env.AUTH_RATE_LIMIT_SECRET?.trim();

  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_RATE_LIMIT_SECRET trebuie configurat cu minimum 32 de caractere."
    );
  }

  return secret;
}

function normalizeAction(action) {
  const normalizedAction =
    typeof action === "string"
      ? action.trim().toLowerCase()
      : "";

  if (!ACTION_PATTERN.test(normalizedAction)) {
    throw new TypeError(
      "Acțiunea pentru limitarea cererilor nu este validă."
    );
  }

  return normalizedAction;
}

function normalizeIdentifier(identifier) {
  const normalizedIdentifier =
    typeof identifier === "string"
      ? identifier.trim().toLowerCase()
      : "";

  if (
    !normalizedIdentifier ||
    normalizedIdentifier.length > 500
  ) {
    throw new TypeError(
      "Identificatorul pentru limitarea cererilor nu este valid."
    );
  }

  return normalizedIdentifier;
}

function createRateLimitKey({
  action,
  identifier,
  windowStartedAt,
}) {
  return createHmac(
    "sha256",
    getRateLimitSecret()
  )
    .update(action, "utf8")
    .update("\0", "utf8")
    .update(identifier, "utf8")
    .update("\0", "utf8")
    .update(windowStartedAt.toISOString(), "utf8")
    .digest("hex");
}

function getPositiveInteger(value, name) {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new TypeError(
      `${name} trebuie să fie un număr întreg pozitiv.`
    );
  }

  return value;
}

export async function consumeAuthRateLimit({
  action,
  identifier,
  limit,
  windowSeconds,
  now = new Date(),
}) {
  const normalizedAction = normalizeAction(action);
  const normalizedIdentifier =
    normalizeIdentifier(identifier);
  const normalizedLimit = getPositiveInteger(
    limit,
    "Limita"
  );
  const normalizedWindowSeconds = getPositiveInteger(
    windowSeconds,
    "Fereastra de timp"
  );
  const currentTime = new Date(now);

  if (Number.isNaN(currentTime.getTime())) {
    throw new TypeError(
      "Data pentru limitarea cererilor nu este validă."
    );
  }

  const windowMilliseconds =
    normalizedWindowSeconds * 1000;
  const windowStartedAt = new Date(
    Math.floor(
      currentTime.getTime() / windowMilliseconds
    ) * windowMilliseconds
  );
  const expiresAt = new Date(
    windowStartedAt.getTime() + windowMilliseconds
  );
  const key = createRateLimitKey({
    action: normalizedAction,
    identifier: normalizedIdentifier,
    windowStartedAt,
  });

  const collection =
    await getAuthRateLimitsCollection();

  const update = {
    $inc: {
      count: 1,
    },
    $set: {
      updatedAt: currentTime,
    },
    $setOnInsert: {
      key,
      action: normalizedAction,
      windowStartedAt,
      expiresAt,
      createdAt: currentTime,
    },
  };

  try {
    await collection.updateOne(
      {
        key,
      },
      update,
      {
        upsert: true,
      }
    );
  } catch (error) {
    if (error?.code !== 11000) {
      throw error;
    }

    await collection.updateOne(
      {
        key,
      },
      {
        $inc: {
          count: 1,
        },
        $set: {
          updatedAt: currentTime,
        },
      }
    );
  }

  const rateLimit = await collection.findOne(
    {
      key,
    },
    {
      projection: {
        _id: 0,
        count: 1,
      },
    }
  );

  const count = rateLimit?.count ?? 1;
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil(
      (expiresAt.getTime() - currentTime.getTime()) /
        1000
    )
  );

  return {
    allowed: count <= normalizedLimit,
    limit: normalizedLimit,
    remaining: Math.max(
      0,
      normalizedLimit - count
    ),
    retryAfterSeconds,
    resetAt: expiresAt,
  };
}
