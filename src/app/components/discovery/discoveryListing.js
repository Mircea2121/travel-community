"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";

import ExperienceCard from "@/app/components/experienceCard/experienceCard";
import { DISCOVERY_SCROLL_STORAGE_KEY } from "./rememberScrollLink";
import "./discoveryListing.css";

async function readJson(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Serverul a trimis un raspuns neasteptat.");
  }
  return response.json();
}

export default function DiscoveryListing({ mode, value, title, description }) {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const loadPosts = useCallback(async ({ nextCursor = "", append = false } = {}) => {
    append ? setIsLoadingMore(true) : setIsLoading(true);
    try {
      const params = new URLSearchParams({ [mode]: value, limit: "12" });
      if (nextCursor) params.set("cursor", nextCursor);
      const response = await fetch(`/api/discovery/posts?${params}`, { cache: "no-store" });
      const payload = await readJson(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Experientele nu au putut fi incarcate.");
      }
      const incoming = Array.isArray(payload.posts) ? payload.posts : [];
      setPosts((current) => append ? [...current, ...incoming] : incoming);
      setCursor(payload.pagination?.nextCursor || null);
      setHasMore(Boolean(payload.pagination?.hasMore));
      setError("");
    } catch (loadError) {
      setError(loadError?.message || "Experientele nu au putut fi incarcate.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [mode, value]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  function handleBack() {
    const fallbackHref = mode === "category" ? "/#categories" : "/#destinations";

    try {
      const storedValue = window.sessionStorage.getItem(
        DISCOVERY_SCROLL_STORAGE_KEY
      );

      if (storedValue) {
        const returnPosition = JSON.parse(storedValue);
        const returnHref = String(returnPosition?.href || "");

        if (returnHref.startsWith("/")) {
          router.push(returnHref, { scroll: false });
          return;
        }
      }
    } catch {
      // Continuăm cu navigarea de rezervă.
    }

    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <main className="discovery-page">
      <header className="discovery-page-header">
        <button type="button" className="discovery-back" onClick={handleBack}>
          <ArrowLeft size={20} aria-hidden="true" />
          <span>Inapoi</span>
        </button>

        <div className="discovery-page-heading">
          <span>Recomandari din comunitate</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>

      {isLoading ? (
        <div className="discovery-state">Se incarca experientele...</div>
      ) : error ? (
        <div className="discovery-state discovery-state-error">
          <p>{error}</p>
          <button type="button" onClick={() => loadPosts()}><RefreshCw size={18} /> Incearca din nou</button>
        </div>
      ) : posts.length === 0 ? (
        <div className="discovery-state">Nu exista inca experiente in aceasta sectiune.</div>
      ) : (
        <>
          <section className="discovery-posts-grid" aria-label={`Experiente: ${title}`}>
            {posts.map((post) => <ExperienceCard key={post.id} post={post} variant="compact" readOnly />)}
          </section>
          {hasMore && (
            <div className="discovery-load-more">
              <button type="button" disabled={isLoadingMore} onClick={() => loadPosts({ nextCursor: cursor, append: true })}>
                {isLoadingMore ? "Se incarca..." : "Incarca mai multe"}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
