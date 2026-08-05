export const PRESENCE_HEARTBEAT_INTERVAL_MS = 30_000;
export const PRESENCE_ONLINE_THRESHOLD_MS = 75_000;

export function getPresenceState(lastSeenAt, now = new Date()) {
  if (!lastSeenAt) {
    return {
      isOnline: false,
      lastSeenAt: null,
    };
  }

  const lastSeenDate =
    lastSeenAt instanceof Date
      ? lastSeenAt
      : new Date(lastSeenAt);

  const nowDate = now instanceof Date ? now : new Date(now);

  if (
    Number.isNaN(lastSeenDate.getTime()) ||
    Number.isNaN(nowDate.getTime())
  ) {
    return {
      isOnline: false,
      lastSeenAt: null,
    };
  }

  const elapsedTime = Math.max(
    nowDate.getTime() - lastSeenDate.getTime(),
    0
  );

  return {
    isOnline: elapsedTime <= PRESENCE_ONLINE_THRESHOLD_MS,
    lastSeenAt: lastSeenDate.toISOString(),
  };
}
