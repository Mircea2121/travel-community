"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowRight,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

import Image from "next/image";
import ExperienceCard from "../experienceCard/experienceCard";
import "./feed.css";

const POPULAR_POSTS_LIMIT = 6;

async function readJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      "Serverul a trimis un răspuns neașteptat."
    );
  }

  return response.json();
}

function getPostId(post) {
  return String(post?._id || post?.id || "");
}

export default function Feed({ initialPosts = null }) {
  const [posts, setPosts] = useState(initialPosts || []);
  const [loading, setLoading] = useState(!initialPosts);
  const [error, setError] = useState("");

  const loadPopularPosts = useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/posts/popular?limit=${POPULAR_POSTS_LIMIT}`,
        {
          method: "GET",
          signal,
        }
      );
      const data = await readJsonResponse(response);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Experiențele populare nu au putut fi încărcate."
        );
      }

      setPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch (loadError) {
      if (loadError?.name === "AbortError") {
        return;
      }

      console.error(
        "Eroare la încărcarea experiențelor populare:",
        loadError
      );

      setError(
        loadError?.message ||
          "A apărut o eroare la încărcarea experiențelor."
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (initialPosts) return;
    const controller = new AbortController();
    const loadTimer = window.setTimeout(() => {
      loadPopularPosts(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
      controller.abort();
    };
  }, [loadPopularPosts, initialPosts]);

  function retryLoading() {
    loadPopularPosts();
  }


  return (
    <section className="feed-section" id="reviews">
      <div className="feed-header">
        <span className="feed-eyebrow">
          <TrendingUp
            size={16}
            strokeWidth={2.3}
            aria-hidden="true"
          />
          Recomandate de comunitate
        </span>

        <h2>Cele mai apreciate experiențe</h2>

        <p>
          Descoperă poveștile care au primit cele mai multe
          aprecieri, comentarii și salvări din partea comunității.
        </p>
      </div>

      {loading && (
        <div
          className="feed-list feed-skeleton-grid"
          aria-label="Se încarcă experiențele"
        >
          {Array.from(
            { length: POPULAR_POSTS_LIMIT },
            (_, index) => (
              <div
                className="feed-card-skeleton"
                key={index}
                aria-hidden="true"
              >
                <span />
                <div>
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            )
          )}
        </div>
      )}

      {!loading && error && (
        <div className="feed-status feed-status-error">
          <span className="feed-status-icon">
            <RefreshCw
              size={30}
              strokeWidth={1.9}
              aria-hidden="true"
            />
          </span>

          <h3>Recomandările nu au putut fi încărcate</h3>
          <p>{error}</p>

          <button type="button" onClick={retryLoading}>
            <RefreshCw
              size={17}
              strokeWidth={2.2}
              aria-hidden="true"
            />
            Încearcă din nou
          </button>
        </div>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="feed-status">
          <span className="feed-status-icon" aria-hidden="true">
            🌍
          </span>
          <h3>Comunitatea așteaptă prima experiență</h3>
          <p>
            Prima poveste publicată va apărea automat aici.
          </p>
        </div>
      )}

      {!loading && !error && posts.length > 0 && (
        <div className="feed-list">
          {posts.map((post) => (
            <ExperienceCard
              key={getPostId(post)}
              post={post}
              variant="compact"
              readOnly
            />
          ))}
        </div>
      )}

      <div className="feed-blog-cta">
        <Image className="feed-cta-background" src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=75" alt="" fill sizes="(max-width: 1120px) 100vw, 1180px" loading="lazy" />
        <div>
          <span>Mai sunt multe de descoperit</span>

          <h3>Explorează toate experiențele comunității</h3>

          <p>
            Intră la Postări pentru a vedea toate postările,
            destinațiile și recomandările publicate de călători.
          </p>
        </div>

        <Link href="/blog" className="feed-blog-link">
          Vezi toate postările
          <ArrowRight
            size={19}
            strokeWidth={2.3}
            aria-hidden="true"
          />
        </Link>
      </div>
    </section>
  );
}
