"use client";

import { useSession } from "../auth/sessionProvider";
import { useEffect } from "react";
import { PRESENCE_HEARTBEAT_INTERVAL_MS } from "@/app/utils/presence";

export const PRESENCE_UPDATED_EVENT = "community:presence-updated";

export default function PresenceHeartbeat() {
  const { user, setUser } = useSession();
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    let isActive = true;
    let requestInProgress = false;

    async function updatePresence() {
      if (
        !isActive ||
        requestInProgress ||
        document.visibilityState !== "visible"
      ) {
        return;
      }

      requestInProgress = true;

      try {
        const response = await fetch("/api/users/presence", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });

        if (!isActive) return;
        if (response.status === 401) {
          isActive = false;
          setUser(null);
          return;
        }
        if (response.ok) {
          window.dispatchEvent(new Event(PRESENCE_UPDATED_EVENT));
        }
      } catch {
        // Următorul heartbeat reîncearcă automat.
      } finally {
        requestInProgress = false;
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        updatePresence();
      }
    }

    updatePresence();

    const intervalId = window.setInterval(
      updatePresence,
      PRESENCE_HEARTBEAT_INTERVAL_MS
    );

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [userId, setUser]);

  return null;
}
