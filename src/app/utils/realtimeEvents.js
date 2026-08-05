export const REALTIME_EVENTS = Object.freeze({
  CONNECTION_READY: "connection:ready",
  CONNECTION_ERROR: "connection:error",

  CONVERSATION_JOIN: "conversation:join",
  CONVERSATION_LEAVE: "conversation:leave",
  CONVERSATION_UPDATED: "conversation:updated",

  MESSAGE_CREATED: "message:created",
  MESSAGE_UPDATED: "message:updated",
  MESSAGE_DELETED: "message:deleted",

  REACTION_UPDATED: "reaction:updated",
  SEEN_UPDATED: "seen:updated",

  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  TYPING_UPDATED: "typing:updated",

  PRESENCE_UPDATED: "presence:updated",
});

export const REALTIME_LIMITS = Object.freeze({
  MAX_CONVERSATION_ROOMS_PER_SOCKET: 25,
  TYPING_TTL_SECONDS: 8,
  TYPING_REFRESH_INTERVAL_MS: 3_000,
  EVENT_ACK_TIMEOUT_MS: 10_000,
});

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export function isValidRealtimeId(value) {
  return (
    typeof value === "string" &&
    OBJECT_ID_PATTERN.test(value.trim())
  );
}

export function getConversationRoom(conversationId) {
  if (!isValidRealtimeId(conversationId)) {
    return null;
  }

  return `conversation:${conversationId.trim().toLowerCase()}`;
}

export function getUserRoom(userId) {
  if (!isValidRealtimeId(userId)) {
    return null;
  }

  return `user:${userId.trim().toLowerCase()}`;
}

export function getTypingKey(conversationId, userId) {
  if (
    !isValidRealtimeId(conversationId) ||
    !isValidRealtimeId(userId)
  ) {
    return null;
  }

  return `typing:${conversationId.trim().toLowerCase()}:${userId
    .trim()
    .toLowerCase()}`;
}

export function createRealtimeAck({
  success,
  message = "",
  data = null,
}) {
  return {
    success: success === true,
    message: typeof message === "string" ? message : "",
    data,
  };
}
