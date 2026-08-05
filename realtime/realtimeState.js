import {
  PRESENCE_ONLINE_THRESHOLD_MS,
} from "../src/app/utils/presence.js";
import {
  REALTIME_LIMITS,
  getTypingKey,
  isValidRealtimeId,
} from "../src/app/utils/realtimeEvents.js";

import { getRedisClients } from "./redis.js";

const PRESENCE_KEY_TTL_BUFFER_MS = 60_000;

function getPresenceKey(userId) {
  if (!isValidRealtimeId(userId)) {
    return null;
  }

  return `presence:${userId.trim().toLowerCase()}:connections`;
}

function isValidSocketId(socketId) {
  return (
    typeof socketId === "string" &&
    socketId.length >= 1 &&
    socketId.length <= 255
  );
}

function requirePresenceIdentifiers(userId, socketId) {
  const key = getPresenceKey(userId);

  if (!key || !isValidSocketId(socketId)) {
    throw new Error("Identificatorii presence nu sunt valizi.");
  }

  return key;
}

export async function touchPresence(
  userId,
  socketId,
  now = new Date()
) {
  const key = requirePresenceIdentifiers(userId, socketId);
  const nowTime = now instanceof Date ? now.getTime() : Number(now);

  if (!Number.isFinite(nowTime)) {
    throw new Error("Momentul presence nu este valid.");
  }

  const expiresAt = nowTime + PRESENCE_ONLINE_THRESHOLD_MS;
  const keyTtl =
    PRESENCE_ONLINE_THRESHOLD_MS + PRESENCE_KEY_TTL_BUFFER_MS;
  const { publisher } = getRedisClients();

  await publisher
    .multi()
    .zRemRangeByScore(key, 0, nowTime)
    .zAdd(key, {
      score: expiresAt,
      value: socketId,
    })
    .pExpire(key, keyTtl)
    .exec();

  return {
    userId,
    isOnline: true,
    lastSeenAt: new Date(nowTime).toISOString(),
  };
}

export async function removePresence(
  userId,
  socketId,
  now = new Date()
) {
  const key = requirePresenceIdentifiers(userId, socketId);
  const nowTime = now instanceof Date ? now.getTime() : Number(now);

  if (!Number.isFinite(nowTime)) {
    throw new Error("Momentul presence nu este valid.");
  }

  const { publisher } = getRedisClients();

  const results = await publisher
    .multi()
    .zRem(key, socketId)
    .zRemRangeByScore(key, 0, nowTime)
    .zCard(key)
    .exec();

  const connectionCount = Number(results?.[2] || 0);

  if (connectionCount === 0) {
    await publisher.del(key);
  }

  return {
    userId,
    isOnline: connectionCount > 0,
    lastSeenAt: new Date(nowTime).toISOString(),
    connectionCount,
  };
}

export async function getPresence(userId, now = new Date()) {
  const key = getPresenceKey(userId);

  if (!key) {
    throw new Error("Utilizatorul presence nu este valid.");
  }

  const nowTime = now instanceof Date ? now.getTime() : Number(now);

  if (!Number.isFinite(nowTime)) {
    throw new Error("Momentul presence nu este valid.");
  }

  const { publisher } = getRedisClients();
  const results = await publisher
    .multi()
    .zRemRangeByScore(key, 0, nowTime)
    .zCard(key)
    .exec();

  return {
    userId,
    isOnline: Number(results?.[1] || 0) > 0,
  };
}

export async function setTyping(conversationId, userId) {
  const key = getTypingKey(conversationId, userId);

  if (!key) {
    throw new Error("Starea typing nu este validă.");
  }

  const { publisher } = getRedisClients();

  await publisher.set(key, "1", {
    EX: REALTIME_LIMITS.TYPING_TTL_SECONDS,
  });

  return {
    conversationId,
    userId,
    isTyping: true,
    expiresAt: new Date(
      Date.now() + REALTIME_LIMITS.TYPING_TTL_SECONDS * 1000
    ).toISOString(),
  };
}

export async function clearTyping(conversationId, userId) {
  const key = getTypingKey(conversationId, userId);

  if (!key) {
    throw new Error("Starea typing nu este validă.");
  }

  const { publisher } = getRedisClients();

  await publisher.del(key);

  return {
    conversationId,
    userId,
    isTyping: false,
    expiresAt: null,
  };
}
