"use client";

import { useLayoutEffect, useState } from "react";
import { DISCOVERY_SCROLL_STORAGE_KEY } from "./rememberScrollLink";

const MAX_RESTORE_AGE_MS = 30 * 60 * 1000;
const MAX_RESTORE_ATTEMPTS = 12;

export default function HomeScrollRestorer() {
  const [isRestoring, setIsRestoring] = useState(true);

  useLayoutEffect(() => {
    let storedValue = null;
    let stateTimer = 0;

    function finishWithoutRestoration() {
      stateTimer = window.setTimeout(() => {
        setIsRestoring(false);
      }, 0);
    }

    try {
      storedValue = window.sessionStorage.getItem(
        DISCOVERY_SCROLL_STORAGE_KEY
      );
    } catch {
      finishWithoutRestoration();
      return () => window.clearTimeout(stateTimer);
    }

    if (!storedValue) {
      finishWithoutRestoration();
      return () => window.clearTimeout(stateTimer);
    }

    let returnPosition;

    try {
      returnPosition = JSON.parse(storedValue);
    } catch {
      window.sessionStorage.removeItem(DISCOVERY_SCROLL_STORAGE_KEY);
      finishWithoutRestoration();
      return () => window.clearTimeout(stateTimer);
    }

    const scrollY = Number(returnPosition?.scrollY);
    const savedAt = Number(returnPosition?.savedAt);

    if (
      !Number.isFinite(scrollY) ||
      scrollY < 0 ||
      !Number.isFinite(savedAt) ||
      Date.now() - savedAt > MAX_RESTORE_AGE_MS
    ) {
      window.sessionStorage.removeItem(DISCOVERY_SCROLL_STORAGE_KEY);
      finishWithoutRestoration();
      return () => window.clearTimeout(stateTimer);
    }

    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    let frameId = 0;
    let attempt = 0;
    let finished = false;

    root.style.scrollBehavior = "auto";

    function finishRestoration() {
      if (finished) return;

      finished = true;
      root.style.scrollBehavior = previousScrollBehavior;
      window.sessionStorage.removeItem(DISCOVERY_SCROLL_STORAGE_KEY);
      setIsRestoring(false);
    }

    function restorePosition() {
      const maximumScrollY = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );

      window.scrollTo({
        top: Math.min(scrollY, maximumScrollY),
        left: 0,
        behavior: "auto",
      });

      const positionIsAvailable = maximumScrollY >= scrollY - 2;

      if (positionIsAvailable || attempt >= MAX_RESTORE_ATTEMPTS) {
        finishRestoration();
        return;
      }

      attempt += 1;
      frameId = window.requestAnimationFrame(restorePosition);
    }

    restorePosition();

    return () => {
      finished = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(stateTimer);
      root.style.scrollBehavior = previousScrollBehavior;
    };
  }, []);

  if (!isRestoring) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        background: "#f5f9ff",
        pointerEvents: "all",
      }}
    />
  );
}
