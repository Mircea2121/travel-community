import { createServer } from "node:http";

import { createAdapter } from "@socket.io/redis-adapter";
import { ObjectId } from "mongodb";
import { Server } from "socket.io";

import {
  getConversationsCollection,
  getUsersCollection,
} from "../src/app/utils/database.js";
import {
  PRESENCE_HEARTBEAT_INTERVAL_MS,
} from "../src/app/utils/presence.js";
import {
  REALTIME_EVENTS,
  REALTIME_LIMITS,
  createRealtimeAck,
  getConversationRoom,
  getUserRoom,
  isValidRealtimeId,
} from "../src/app/utils/realtimeEvents.js";

import { authenticateSocket } from "./authenticateSocket.js";
import { startChangeStreams } from "./changeStreams.js";
import { closeRedis, connectRedis } from "./redis.js";
import {
  clearTyping,
  removePresence,
  setTyping,
  touchPresence,
} from "./realtimeState.js";

const DEFAULT_PORT = 3001;
const DEFAULT_HOST = "127.0.0.1";
const SOCKET_PATH = "/socket.io";
const MAX_HTTP_BUFFER_SIZE = 64 * 1024;
const TYPING_EVENT_MIN_INTERVAL_MS = 500;

function getServerPort() {
  const value = Number(process.env.REALTIME_PORT || DEFAULT_PORT);

  if (!Number.isInteger(value) || value < 1 || value > 65_535) {
    throw new Error("REALTIME_PORT nu este valid.");
  }

  return value;
}

function getAllowedOrigins() {
  const configuredOrigins = [
    process.env.APP_URL,
    process.env.REALTIME_ALLOWED_ORIGINS,
  ]
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  if (process.env.NODE_ENV !== "production") {
    configuredOrigins.push(
      "http://localhost:3000",
      "http://127.0.0.1:3000"
    );
  }

  const origins = [...new Set(configuredOrigins)];

  if (process.env.NODE_ENV === "production" && origins.length === 0) {
    throw new Error(
      "APP_URL sau REALTIME_ALLOWED_ORIGINS trebuie definit în producție."
    );
  }

  return origins;
}

function sendJson(response, status, body) {
  const payload = JSON.stringify(body);

  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(payload);
}

function createHealthServer() {
  return createServer((request, response) => {
    if (request.method === "GET" && request.url === "/health") {
      sendJson(response, 200, {
        success: true,
        service: "travel-community-realtime",
      });
      return;
    }

    sendJson(response, 404, {
      success: false,
      message: "Ruta nu există.",
    });
  });
}

function safelyAcknowledge(acknowledge, payload) {
  if (typeof acknowledge === "function") {
    acknowledge(payload);
  }
}

async function isConversationParticipant(conversationId, userId) {
  if (
    !isValidRealtimeId(conversationId) ||
    !isValidRealtimeId(userId)
  ) {
    return false;
  }

  const conversationsCollection =
    await getConversationsCollection();

  const conversation = await conversationsCollection.findOne(
    {
      _id: new ObjectId(conversationId),
      participants: new ObjectId(userId),
    },
    {
      projection: {
        _id: 1,
      },
    }
  );

  return Boolean(conversation);
}

async function updateLastSeen(userId, isOnline, date) {
  const usersCollection = await getUsersCollection();

  await usersCollection.updateOne(
    {
      _id: new ObjectId(userId),
    },
    {
      $set: {
        isOnline,
        lastSeenAt: date,
      },
    }
  );
}

async function broadcastPresence(io, userId, presence) {
  const conversationsCollection =
    await getConversationsCollection();

  const conversations = await conversationsCollection
    .find(
      {
        participants: new ObjectId(userId),
      },
      {
        projection: {
          _id: 1,
        },
      }
    )
    .toArray();

  for (const conversation of conversations) {
    const room = getConversationRoom(conversation._id.toString());

    if (room) {
      io.to(room).emit(REALTIME_EVENTS.PRESENCE_UPDATED, presence);
    }
  }
}

function registerSocketHandlers(io, socket) {
  const userId = socket.data.userId;
  const userRoom = getUserRoom(userId);
  const joinedConversations = new Set();
  const typingEventTimes = new Map();
  let presenceInterval = null;
  let tokenExpirationTimer = null;

  socket.data.joinedConversations = joinedConversations;

  if (userRoom) {
    socket.join(userRoom);
  }

  const connectionTime = new Date();

  touchPresence(userId, socket.id, connectionTime)
    .then(async (presence) => {
      await updateLastSeen(userId, true, connectionTime);
      await broadcastPresence(io, userId, presence);
    })
    .catch((error) => {
      console.error("Presence connection error:", error);
    });

  presenceInterval = setInterval(() => {
    const now = new Date();

    touchPresence(userId, socket.id, now)
      .then(() => updateLastSeen(userId, true, now))
      .catch((error) => {
        console.error("Presence heartbeat error:", error);
      });
  }, PRESENCE_HEARTBEAT_INTERVAL_MS);

  const tokenExpiresAt = socket.data.tokenExpiresAt;

  if (Number.isFinite(tokenExpiresAt)) {
    const timeUntilExpiration = Math.max(
      tokenExpiresAt - Date.now(),
      0
    );

    tokenExpirationTimer = setTimeout(() => {
      socket.emit(REALTIME_EVENTS.CONNECTION_ERROR, {
        code: "AUTH_TOKEN_EXPIRED",
        message: "Sesiunea a expirat.",
      });
      socket.disconnect(true);
    }, timeUntilExpiration);
  }

  socket.emit(REALTIME_EVENTS.CONNECTION_READY, {
    userId,
    connectedAt: connectionTime.toISOString(),
  });

  socket.on(
    REALTIME_EVENTS.CONVERSATION_JOIN,
    async (payload, acknowledge) => {
      try {
        const conversationId =
          typeof payload?.conversationId === "string"
            ? payload.conversationId.trim().toLowerCase()
            : "";

        if (!isValidRealtimeId(conversationId)) {
          safelyAcknowledge(
            acknowledge,
            createRealtimeAck({
              success: false,
              message: "Conversația este invalidă.",
            })
          );
          return;
        }

        if (joinedConversations.has(conversationId)) {
          safelyAcknowledge(
            acknowledge,
            createRealtimeAck({
              success: true,
              data: { conversationId },
            })
          );
          return;
        }

        if (
          joinedConversations.size >=
          REALTIME_LIMITS.MAX_CONVERSATION_ROOMS_PER_SOCKET
        ) {
          safelyAcknowledge(
            acknowledge,
            createRealtimeAck({
              success: false,
              message: "Ai prea multe conversații active.",
            })
          );
          return;
        }

        const hasAccess = await isConversationParticipant(
          conversationId,
          userId
        );

        if (!hasAccess) {
          safelyAcknowledge(
            acknowledge,
            createRealtimeAck({
              success: false,
              message: "Nu ai acces la această conversație.",
            })
          );
          return;
        }

        const room = getConversationRoom(conversationId);

        await socket.join(room);
        joinedConversations.add(conversationId);

        safelyAcknowledge(
          acknowledge,
          createRealtimeAck({
            success: true,
            data: { conversationId },
          })
        );
      } catch (error) {
        console.error("Conversation join error:", error);

        safelyAcknowledge(
          acknowledge,
          createRealtimeAck({
            success: false,
            message: "Conversația nu a putut fi deschisă realtime.",
          })
        );
      }
    }
  );

  socket.on(
    REALTIME_EVENTS.CONVERSATION_LEAVE,
    async (payload, acknowledge) => {
      const conversationId =
        typeof payload?.conversationId === "string"
          ? payload.conversationId.trim().toLowerCase()
          : "";

      if (!joinedConversations.has(conversationId)) {
        safelyAcknowledge(
          acknowledge,
          createRealtimeAck({ success: true })
        );
        return;
      }

      const room = getConversationRoom(conversationId);

      joinedConversations.delete(conversationId);
      typingEventTimes.delete(conversationId);

      await clearTyping(conversationId, userId).catch(() => {});
      socket.to(room).emit(REALTIME_EVENTS.TYPING_UPDATED, {
        conversationId,
        userId,
        isTyping: false,
        expiresAt: null,
      });
      await socket.leave(room);

      safelyAcknowledge(
        acknowledge,
        createRealtimeAck({ success: true })
      );
    }
  );

  socket.on(
    REALTIME_EVENTS.TYPING_START,
    async (payload, acknowledge) => {
      try {
        const conversationId =
          typeof payload?.conversationId === "string"
            ? payload.conversationId.trim().toLowerCase()
            : "";

        if (!joinedConversations.has(conversationId)) {
          safelyAcknowledge(
            acknowledge,
            createRealtimeAck({
              success: false,
              message: "Conversația nu este activă.",
            })
          );
          return;
        }

        const now = Date.now();
        const lastEventAt = typingEventTimes.get(conversationId) || 0;

        if (now - lastEventAt < TYPING_EVENT_MIN_INTERVAL_MS) {
          safelyAcknowledge(
            acknowledge,
            createRealtimeAck({ success: true })
          );
          return;
        }

        typingEventTimes.set(conversationId, now);

        const typing = await setTyping(conversationId, userId);
        const room = getConversationRoom(conversationId);

        socket
          .to(room)
          .emit(REALTIME_EVENTS.TYPING_UPDATED, typing);

        safelyAcknowledge(
          acknowledge,
          createRealtimeAck({
            success: true,
            data: typing,
          })
        );
      } catch (error) {
        console.error("Typing start error:", error);

        safelyAcknowledge(
          acknowledge,
          createRealtimeAck({
            success: false,
            message: "Typing nu a putut fi actualizat.",
          })
        );
      }
    }
  );

  socket.on(
    REALTIME_EVENTS.TYPING_STOP,
    async (payload, acknowledge) => {
      try {
        const conversationId =
          typeof payload?.conversationId === "string"
            ? payload.conversationId.trim().toLowerCase()
            : "";

        if (!joinedConversations.has(conversationId)) {
          safelyAcknowledge(
            acknowledge,
            createRealtimeAck({ success: true })
          );
          return;
        }

        typingEventTimes.delete(conversationId);

        const typing = await clearTyping(conversationId, userId);
        const room = getConversationRoom(conversationId);

        socket
          .to(room)
          .emit(REALTIME_EVENTS.TYPING_UPDATED, typing);

        safelyAcknowledge(
          acknowledge,
          createRealtimeAck({
            success: true,
            data: typing,
          })
        );
      } catch (error) {
        console.error("Typing stop error:", error);

        safelyAcknowledge(
          acknowledge,
          createRealtimeAck({
            success: false,
            message: "Typing nu a putut fi oprit.",
          })
        );
      }
    }
  );

  socket.on("disconnect", async () => {
    if (presenceInterval) {
      clearInterval(presenceInterval);
    }

    if (tokenExpirationTimer) {
      clearTimeout(tokenExpirationTimer);
    }

    const typingConversations = [...joinedConversations];

    await Promise.allSettled(
      typingConversations.map(async (conversationId) => {
        const typing = await clearTyping(conversationId, userId);
        const room = getConversationRoom(conversationId);

        socket
          .to(room)
          .emit(REALTIME_EVENTS.TYPING_UPDATED, typing);
      })
    );

    try {
      const disconnectedAt = new Date();
      const presence = await removePresence(
        userId,
        socket.id,
        disconnectedAt
      );

      if (!presence.isOnline) {
        await updateLastSeen(userId, false, disconnectedAt);
        await broadcastPresence(io, userId, presence);
      }
    } catch (error) {
      console.error("Presence disconnect error:", error);
    }
  });
}

async function startServer() {
  const port = getServerPort();
  const host = process.env.REALTIME_HOST?.trim() || DEFAULT_HOST;
  const allowedOrigins = getAllowedOrigins();
  const httpServer = createHealthServer();
  const io = new Server(httpServer, {
    path: SOCKET_PATH,
    transports: ["websocket"],
    allowUpgrades: false,
    maxHttpBufferSize: MAX_HTTP_BUFFER_SIZE,
    serveClient: false,
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  const { publisher, subscriber } = await connectRedis();

  io.adapter(createAdapter(publisher, subscriber));
  io.use(authenticateSocket);
  io.on("connection", (socket) => {
    registerSocketHandlers(io, socket);
  });

  const stopChangeStreams = startChangeStreams(io);
  let shuttingDown = false;

  async function shutdown(signal) {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.info(`Realtime shutdown: ${signal}`);

    const forceExitTimer = setTimeout(() => {
      process.exit(1);
    }, 15_000);

    forceExitTimer.unref();

    try {
      await stopChangeStreams();

      await new Promise((resolve) => {
        io.close(() => resolve());
      });

      await closeRedis();

      await new Promise((resolve) => {
        httpServer.close(() => resolve());
      });

      clearTimeout(forceExitTimer);
      process.exit(0);
    } catch (error) {
      console.error("Realtime shutdown error:", error);
      process.exit(1);
    }
  }

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));

  await new Promise((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(port, host, () => {
      httpServer.off("error", reject);
      resolve();
    });
  });

  console.info(
    `Realtime server listening on http://${host}:${port}${SOCKET_PATH}`
  );
}

startServer().catch(async (error) => {
  console.error("Realtime server startup error:", error);
  await closeRedis().catch(() => {});
  process.exit(1);
});
