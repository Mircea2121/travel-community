import { randomUUID } from "node:crypto";

import {
  getConversationsCollection,
  getMessagesCollection,
  getUsersCollection,
} from "../src/app/utils/database.js";
import { serializeMessage } from "../src/app/utils/messageSerializer.js";
import {
  REALTIME_EVENTS,
  getConversationRoom,
  getUserRoom,
} from "../src/app/utils/realtimeEvents.js";

import { getRedisClients } from "./redis.js";

const LEADER_LOCK_KEY = "realtime:change-streams:leader";
const LEADER_LOCK_TTL_MS = 30_000;
const LEADER_LOCK_REFRESH_MS = 10_000;
const LEADER_RETRY_MS = 5_000;

const RENEW_LOCK_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("pexpire", KEYS[1], ARGV[2])
  end
  return 0
`;

const RELEASE_LOCK_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  end
  return 0
`;

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function getChangedFields(change) {
  const updatedFields =
    change?.updateDescription?.updatedFields || {};
  const removedFields =
    change?.updateDescription?.removedFields || [];

  return new Set([
    ...Object.keys(updatedFields),
    ...removedFields,
  ]);
}

function fieldChanged(fields, fieldName) {
  for (const field of fields) {
    if (
      field === fieldName ||
      field.startsWith(`${fieldName}.`)
    ) {
      return true;
    }
  }

  return false;
}

async function getReplyToMessage(
  messagesCollection,
  message
) {
  if (!message?.replyTo) {
    return null;
  }

  return messagesCollection.findOne(
    {
      _id: message.replyTo,
      conversationId: message.conversationId,
    },
    {
      projection: {
        _id: 1,
        senderId: 1,
        text: 1,
        images: 1,
        messageType: 1,
        isDeleted: 1,
      },
    }
  );
}

async function handleMessageChange(
  io,
  messagesCollection,
  change
) {
  const message = change.fullDocument;

  if (!message?._id || !message?.conversationId) {
    return;
  }

  const room = getConversationRoom(
    message.conversationId.toString()
  );

  if (!room) {
    return;
  }

  const replyToMessage = await getReplyToMessage(
    messagesCollection,
    message
  );
  const serializedMessage = serializeMessage(message, {
    replyToMessage,
  });

  if (!serializedMessage) {
    return;
  }

  if (change.operationType === "insert") {
    io.to(room).emit(
      REALTIME_EVENTS.MESSAGE_CREATED,
      serializedMessage
    );
    return;
  }

  io.to(room).emit(
    REALTIME_EVENTS.MESSAGE_UPDATED,
    serializedMessage
  );

  const fields = getChangedFields(change);

  if (fieldChanged(fields, "reactions")) {
    io.to(room).emit(REALTIME_EVENTS.REACTION_UPDATED, {
      conversationId: serializedMessage.conversationId,
      messageId: serializedMessage._id,
      reactions: serializedMessage.reactions,
      updatedAt: serializedMessage.updatedAt,
    });
  }

  if (
    fieldChanged(fields, "seenBy") ||
    fieldChanged(fields, "isRead")
  ) {
    io.to(room).emit(REALTIME_EVENTS.SEEN_UPDATED, {
      conversationId: serializedMessage.conversationId,
      messageId: serializedMessage._id,
      seenBy: serializedMessage.seenBy,
      isRead: serializedMessage.isRead,
    });
  }

  if (
    fieldChanged(fields, "isDeleted") ||
    fieldChanged(fields, "deletedFor")
  ) {
    io.to(room).emit(
      REALTIME_EVENTS.MESSAGE_DELETED,
      serializedMessage
    );
  }
}

function handleConversationChange(io, change) {
  const conversation = change.fullDocument;

  if (
    !conversation?._id ||
    !Array.isArray(conversation.participants)
  ) {
    return;
  }

  const payload = {
    conversationId: conversation._id.toString(),
    lastMessage: conversation.lastMessage || "",
    lastMessageType:
      conversation.lastMessageType || "text",
    lastMessageSenderId:
      conversation.lastMessageSenderId?.toString?.() ||
      null,
    lastMessageAt:
      conversation.lastMessageAt instanceof Date
        ? conversation.lastMessageAt.toISOString()
        : null,
    updatedAt:
      conversation.updatedAt instanceof Date
        ? conversation.updatedAt.toISOString()
        : null,
  };

  for (const participantId of conversation.participants) {
    const room = getUserRoom(participantId.toString());

    if (room) {
      io.to(room).emit(
        REALTIME_EVENTS.CONVERSATION_UPDATED,
        payload
      );
    }
  }
}

function handleUserAuthenticationChange(io, change) {
  const user = change.fullDocument;

  if (!user?._id) {
    return;
  }

  const room = getUserRoom(user._id.toString());

  if (!room) {
    return;
  }

  io.to(room).emit(REALTIME_EVENTS.CONNECTION_ERROR, {
    code: "AUTH_SESSION_REVOKED",
    message:
      "Sesiunea a fost închisă deoarece parola contului a fost schimbată.",
  });

  io.in(room).disconnectSockets(true);
}

async function openChangeStreams(io, onError) {
  const messagesCollection = await getMessagesCollection();
  const conversationsCollection =
    await getConversationsCollection();
  const usersCollection = await getUsersCollection();

  const messageStream = messagesCollection.watch(
    [
      {
        $match: {
          operationType: {
            $in: ["insert", "update", "replace"],
          },
        },
      },
    ],
    {
      fullDocument: "updateLookup",
    }
  );

  const conversationStream = conversationsCollection.watch(
    [
      {
        $match: {
          operationType: {
            $in: ["insert", "update", "replace"],
          },
        },
      },
    ],
    {
      fullDocument: "updateLookup",
    }
  );

  const userAuthenticationStream = usersCollection.watch(
    [
      {
        $match: {
          operationType: "update",
          "updateDescription.updatedFields.authVersion": {
            $exists: true,
          },
        },
      },
    ],
    {
      fullDocument: "updateLookup",
    }
  );

  messageStream.on("change", (change) => {
    handleMessageChange(
      io,
      messagesCollection,
      change
    ).catch(onError);
  });

  conversationStream.on("change", (change) => {
    try {
      handleConversationChange(io, change);
    } catch (error) {
      onError(error);
    }
  });

  userAuthenticationStream.on("change", (change) => {
    try {
      handleUserAuthenticationChange(io, change);
    } catch (error) {
      onError(error);
    }
  });

  messageStream.on("error", onError);
  conversationStream.on("error", onError);
  userAuthenticationStream.on("error", onError);

  return async () => {
    await Promise.allSettled([
      messageStream.close(),
      conversationStream.close(),
      userAuthenticationStream.close(),
    ]);
  };
}

export function startChangeStreams(io) {
  const lockToken = randomUUID();
  let stopped = false;
  let closeStreams = null;
  let leaderLoopPromise = null;

  async function releaseLeadership() {
    if (closeStreams) {
      const close = closeStreams;
      closeStreams = null;
      await close();
    }

    const { publisher } = getRedisClients();

    await publisher.eval(RELEASE_LOCK_SCRIPT, {
      keys: [LEADER_LOCK_KEY],
      arguments: [lockToken],
    });
  }

  async function runAsLeader() {
    let streamFailed = false;

    const handleStreamError = (error) => {
      console.error("MongoDB change stream error:", error);
      streamFailed = true;
    };

    closeStreams = await openChangeStreams(
      io,
      handleStreamError
    );
    console.info(
      "Realtime change-stream leadership acquired."
    );

    while (!stopped && !streamFailed) {
      await wait(LEADER_LOCK_REFRESH_MS);

      if (stopped || streamFailed) {
        break;
      }

      const { publisher } = getRedisClients();
      const renewed = await publisher.eval(
        RENEW_LOCK_SCRIPT,
        {
          keys: [LEADER_LOCK_KEY],
          arguments: [
            lockToken,
            String(LEADER_LOCK_TTL_MS),
          ],
        }
      );

      if (Number(renewed) !== 1) {
        console.warn(
          "Realtime change-stream leadership lost."
        );
        break;
      }
    }

    await releaseLeadership();
  }

  async function leaderLoop() {
    const { publisher } = getRedisClients();

    while (!stopped) {
      try {
        const acquired = await publisher.set(
          LEADER_LOCK_KEY,
          lockToken,
          {
            NX: true,
            PX: LEADER_LOCK_TTL_MS,
          }
        );

        if (acquired === "OK") {
          await runAsLeader();
        }
      } catch (error) {
        console.error(
          "Change-stream leader loop error:",
          error
        );
      }

      if (!stopped) {
        await wait(LEADER_RETRY_MS);
      }
    }
  }

  leaderLoopPromise = leaderLoop();

  return async function stopChangeStreams() {
    stopped = true;

    await releaseLeadership().catch((error) => {
      console.error(
        "Change-stream shutdown error:",
        error
      );
    });

    await leaderLoopPromise;
  };
}
