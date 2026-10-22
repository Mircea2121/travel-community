"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const SessionContext = createContext(null);

export default function SessionProvider({ children }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Session unavailable");
        const data = await response.json();
        if (!controller.signal.aborted) setUser(data.user || null);
      } catch {
        // A temporary network/server error must not tear down a known session.
        // A successful anonymous response above explicitly clears expired sessions.
      } finally {
        if (!controller.signal.aborted) setIsLoadingUser(false);
      }
    }
    loadSession();
    return () => controller.abort();
  }, [pathname]);

  const value = useMemo(() => ({ user, setUser, isLoadingUser }), [user, isLoadingUser]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession requires SessionProvider");
  return context;
}
