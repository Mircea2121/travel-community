"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  REALTIME_EVENTS,
  REALTIME_LIMITS,
  isValidRealtimeId,
} from "@/app/utils/realtimeEvents";
import {
  connectRealtime,
  disconnectRealtime,
  getRealtimeSocket,
} from "@/app/utils/realtimeClient";

const RealtimeContext = createContext(null);

function normalizeError(error) {
  return {
    code:
      typeof error?.data?.code === "string"
        ? error.data.code
        : typeof error?.code === "string"
          ? error.code
          : "REALTIME_CONNECTION_ERROR",
    message:
      typeof error?.message === "string" && error.message.trim()
        ? error.message
        : "Conexiunea realtime nu este disponibilă.",
  };
}

export default function RealtimeProvider({ children }) {
  const [status, setStatus] = useState("connecting");
  const [connectionError, setConnectionError] = useState(null);
  const [activeSocket, setActiveSocket] = useState(null);
  const socketRef = useRef(null);
  const roomReferencesRef = useRef(new Map());

  useEffect(() => {
    const socket = connectRealtime();

    if (!socket) {
      queueMicrotask(() => {
        setStatus("unavailable");
        setConnectionError({
        code: "REALTIME_BROWSER_UNAVAILABLE",
        message: "Conexiunea realtime nu este disponibilă.",
        });
      });
      return undefined;
    }

    socketRef.current = socket;
    queueMicrotask(() => setActiveSocket(socket));
    const roomReferences = roomReferencesRef.current;

    function handleConnect() {
      setStatus("connected");
      setConnectionError(null);

      for (const conversationId of roomReferencesRef.current.keys()) {
        socket.emit(REALTIME_EVENTS.CONVERSATION_JOIN, {
          conversationId,
        });
      }
    }

    function handleDisconnect(reason) {
      setStatus(reason === "io client disconnect" ? "idle" : "reconnecting");
    }

    function handleConnectError(error) {
      setStatus("unavailable");
      setConnectionError(normalizeError(error));
    }

    function handleConnectionReady() {
      setStatus("connected");
      setConnectionError(null);
    }

    function handleConnectionError(error) {
      setConnectionError(normalizeError(error));
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on(
      REALTIME_EVENTS.CONNECTION_READY,
      handleConnectionReady
    );
    socket.on(
      REALTIME_EVENTS.CONNECTION_ERROR,
      handleConnectionError
    );

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off(
        REALTIME_EVENTS.CONNECTION_READY,
        handleConnectionReady
      );
      socket.off(
        REALTIME_EVENTS.CONNECTION_ERROR,
        handleConnectionError
      );

      roomReferences.clear();
      socketRef.current = null;
      setActiveSocket(null);
      disconnectRealtime();
    };
  }, []);

  const emitWithAck = useCallback((eventName, payload) => {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current || getRealtimeSocket();

      if (!socket?.connected) {
        reject(
          new Error("Conexiunea realtime nu este disponibilă.")
        );
        return;
      }

      socket
        .timeout(REALTIME_LIMITS.EVENT_ACK_TIMEOUT_MS)
        .emit(eventName, payload, (error, response) => {
          if (error) {
            reject(
              new Error("Serverul realtime nu a răspuns la timp.")
            );
            return;
          }

          if (!response?.success) {
            reject(
              new Error(
                response?.message ||
                  "Operația realtime nu a putut fi finalizată."
              )
            );
            return;
          }

          resolve(response.data ?? null);
        });
    });
  }, []);

  const joinConversation = useCallback(
    async (conversationId) => {
      if (!isValidRealtimeId(conversationId)) {
        throw new Error("Conversația este invalidă.");
      }

      const normalizedId = conversationId.toLowerCase();
      const currentCount =
        roomReferencesRef.current.get(normalizedId) || 0;

      roomReferencesRef.current.set(
        normalizedId,
        currentCount + 1
      );

      if (currentCount > 0) {
        return {
          conversationId: normalizedId,
        };
      }

      try {
        return await emitWithAck(
          REALTIME_EVENTS.CONVERSATION_JOIN,
          {
            conversationId: normalizedId,
          }
        );
      } catch (error) {
        roomReferencesRef.current.delete(normalizedId);
        throw error;
      }
    },
    [emitWithAck]
  );

  const leaveConversation = useCallback(
    async (conversationId) => {
      if (!isValidRealtimeId(conversationId)) {
        return;
      }

      const normalizedId = conversationId.toLowerCase();
      const currentCount =
        roomReferencesRef.current.get(normalizedId) || 0;

      if (currentCount <= 1) {
        roomReferencesRef.current.delete(normalizedId);

        if (socketRef.current?.connected) {
          await emitWithAck(
            REALTIME_EVENTS.CONVERSATION_LEAVE,
            {
              conversationId: normalizedId,
            }
          ).catch(() => {});
        }

        return;
      }

      roomReferencesRef.current.set(
        normalizedId,
        currentCount - 1
      );
    },
    [emitWithAck]
  );

  const value = useMemo(
    () => ({
      socket: activeSocket,
      activeSocket,
      status,
      isConnected: status === "connected",
      connectionError,
      emitWithAck,
      joinConversation,
      leaveConversation,
    }),
    [
      activeSocket,
      status,
      connectionError,
      emitWithAck,
      joinConversation,
      leaveConversation,
    ]
  );

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);

  if (!context) {
    throw new Error(
      "useRealtime trebuie utilizat în interiorul RealtimeProvider."
    );
  }

  return context;
}
