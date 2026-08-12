"use client";

import { useEffect } from "react";
import { PRESENCE_HEARTBEAT_INTERVAL_MS } from "@/app/utils/presence";

export const PRESENCE_UPDATED_EVENT = "community:presence-updated";

export default function PresenceHeartbeat() {
  useEffect(() => {
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
  }, []);

  return null;
}
