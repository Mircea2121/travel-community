"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { PRESENCE_UPDATED_EVENT } from "@/app/components/presence/presenceHeartbeat";

const REFRESH_INTERVAL_MS = 30_000;
const CommunityOverviewContext = createContext(null);

const INITIAL_DATA = {
  stats: {
    activeMembers: 0,
    accountsCreated: 0,
    postsPublished: 0,
    countriesCount: 0,
  },
  popularCountries: [],
  updatedAt: null,
};

async function readJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error("Serverul a trimis un răspuns neașteptat.");
  }

  return response.json();
}

export default function CommunityOverviewProvider({ children }) {
  const [data, setData] = useState(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    let controller = null;

    async function loadOverview({ silent = false } = {}) {
      controller?.abort();
      controller = new AbortController();

      if (!silent) {
        setIsLoading(true);
      }

      try {
        const response = await fetch("/api/discovery/overview", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await readJsonResponse(response);

        if (!response.ok || !payload?.success) {
          throw new Error(
            payload?.message || "Datele comunității nu au putut fi încărcate."
          );
        }

        if (isMounted) {
          setData({
            stats: { ...INITIAL_DATA.stats, ...payload.stats },
            popularCountries: Array.isArray(payload.popularCountries)
              ? payload.popularCountries
              : [],
            updatedAt: payload.updatedAt || null,
          });
          setError("");
        }
      } catch (loadError) {
        if (loadError?.name !== "AbortError" && isMounted) {
          setError(
            loadError?.message || "Datele comunității nu au putut fi încărcate."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadOverview();

    const intervalId = window.setInterval(
      () => loadOverview({ silent: true }),
      REFRESH_INTERVAL_MS
    );

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        loadOverview({ silent: true });
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener(PRESENCE_UPDATED_EVENT, handleVisibilityChange);

    return () => {
      isMounted = false;
      controller?.abort();
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener(PRESENCE_UPDATED_EVENT, handleVisibilityChange);
    };
  }, []);

  const value = useMemo(
    () => ({ data, isLoading, error }),
    [data, isLoading, error]
  );

  return (
    <CommunityOverviewContext.Provider value={value}>
      {children}
    </CommunityOverviewContext.Provider>
  );
}

export function useCommunityOverview() {
  const context = useContext(CommunityOverviewContext);

  if (!context) {
    throw new Error(
      "useCommunityOverview trebuie folosit în CommunityOverviewProvider."
    );
  }

  return context;
}
