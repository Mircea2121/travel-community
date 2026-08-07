"use client";

import { useEffect } from "react";
import { DISCOVERY_SCROLL_STORAGE_KEY } from "./rememberScrollLink";

const MAX_RESTORE_AGE_MS = 30 * 60 * 1000;
const RESTORE_DELAYS_MS = [0, 80, 180, 350, 650];

export default function HomeScrollRestorer() {
  useEffect(() => {
    let storedValue;

    try {
      storedValue = window.sessionStorage.getItem(
        DISCOVERY_SCROLL_STORAGE_KEY
      );
    } catch {
      return undefined;
    }

    if (!storedValue) return undefined;

    let returnPosition;

    try {
      returnPosition = JSON.parse(storedValue);
    } catch {
      window.sessionStorage.removeItem(DISCOVERY_SCROLL_STORAGE_KEY);
      return undefined;
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
      return undefined;
    }

    const previousScrollBehavior =
      document.documentElement.style.scrollBehavior;
    const timeoutIds = [];

    document.documentElement.style.scrollBehavior = "auto";

    for (const delay of RESTORE_DELAYS_MS) {
      timeoutIds.push(
        window.setTimeout(() => {
          window.scrollTo({ top: scrollY, left: 0, behavior: "auto" });
        }, delay)
      );
    }

    timeoutIds.push(
      window.setTimeout(() => {
        document.documentElement.style.scrollBehavior =
          previousScrollBehavior;
        window.sessionStorage.removeItem(DISCOVERY_SCROLL_STORAGE_KEY);
      }, 750)
    );

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      document.documentElement.style.scrollBehavior =
        previousScrollBehavior;
    };
  }, []);

  return null;
}
