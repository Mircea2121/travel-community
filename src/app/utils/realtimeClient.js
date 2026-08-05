"use client";

import { io } from "socket.io-client";

const SOCKET_PATH = "/socket.io";
const LOCAL_REALTIME_PORT = 3001;
const SOCKET_CONNECTION_TIMEOUT_MS = 10_000;
const SOCKET_RECONNECTION_DELAY_MS = 1_000;
const SOCKET_RECONNECTION_MAX_DELAY_MS = 10_000;
const GLOBAL_SOCKET_KEY = "__travelCommunityRealtimeSocket";

function isRealtimeEnabled() {
  const configuredValue =
    process.env.NEXT_PUBLIC_REALTIME_ENABLED?.trim().toLowerCase();

  if (configuredValue === "true") {
    return true;
  }

  if (configuredValue === "false") {
    return false;
  }

  return process.env.NODE_ENV === "production";
}

function getRealtimeUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_REALTIME_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  if (typeof window === "undefined") {
    return "";
  }

  const { protocol, hostname, origin } = window.location;
  const isLocalDevelopment =
    hostname === "localhost" || hostname === "127.0.0.1";

  if (isLocalDevelopment) {
    return `${protocol}//${hostname}:${LOCAL_REALTIME_PORT}`;
  }

  return origin;
}

function createRealtimeSocket() {
  return io(getRealtimeUrl(), {
    path: SOCKET_PATH,
    autoConnect: false,
    transports: ["websocket"],
    upgrade: false,
    withCredentials: true,
    timeout: SOCKET_CONNECTION_TIMEOUT_MS,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: SOCKET_RECONNECTION_DELAY_MS,
    reconnectionDelayMax: SOCKET_RECONNECTION_MAX_DELAY_MS,
    randomizationFactor: 0.5,
  });
}

export function getRealtimeSocket() {
  if (typeof window === "undefined" || !isRealtimeEnabled()) {
    return null;
  }

  if (!window[GLOBAL_SOCKET_KEY]) {
    window[GLOBAL_SOCKET_KEY] = createRealtimeSocket();
  }

  return window[GLOBAL_SOCKET_KEY];
}

export function connectRealtime() {
  const socket = getRealtimeSocket();

  if (socket && !socket.connected && !socket.active) {
    socket.connect();
  }

  return socket;
}

export function disconnectRealtime() {
  const socket = getRealtimeSocket();

  if (socket) {
    socket.disconnect();
  }
}

export function resetRealtimeClient() {
  if (typeof window === "undefined") {
    return;
  }

  const socket = window[GLOBAL_SOCKET_KEY];

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    delete window[GLOBAL_SOCKET_KEY];
  }
}
