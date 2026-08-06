"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  Compass,
  RefreshCw,
  Sparkles,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

import ExperienceCard from "../experienceCard/experienceCard";
import { useToast } from "../toast/toastProvider";

const FEED_SCOPES = {
  ALL: "all",
  FOLLOWING: "following",
};

const EMPTY_FEED_STATE = {
  posts: [],
  nextCursor: null,
  hasMore: false,
  loading: false,
  loadingMore: false,
  initialized: false,
  authRequired: false,
  error: "",
};

function createInitialFeeds() {
  return {
    [FEED_SCOPES.ALL]: {
      ...EMPTY_FEED_STATE,
    },
    [FEED_SCOPES.FOLLOWING]: {
      ...EMPTY_FEED_STATE,
    },
  };
}

async function readJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error("Serverul a trimis un răspuns neașteptat.");
  }

  return response.json();
}

function getPostId(post) {
  return String(post?._id || post?.id || "");
}

function getFeedTitle(scope) {
  return scope === FEED_SCOPES.FOLLOWING
    ? "De la oamenii pe care îi urmărești"
    : "Experiențe din întreaga comunitate";
}

export default function BlogClient() {
  const router = useRouter();
  const toast = useToast();
  const initializedScopesRef = useRef(new Set());
  const [activeScope, setActiveScope] = useState(FEED_SCOPES.ALL);
  const [feeds, setFeeds] = useState(createInitialFeeds);
  const [pendingLikeIds, setPendingLikeIds] = useState(
    () => new Set()
  );
  const [pendingSaveIds, setPendingSaveIds] = useState(
    () => new Set()
  );

  const loadFeed = useCallback(async (scope, cursor = null) => {
    const isLoadingMore = Boolean(cursor);

    setFeeds((currentFeeds) => ({
      ...currentFeeds,
      [scope]: {
        ...currentFeeds[scope],
        loading: !isLoadingMore,
        loadingMore: isLoadingMore,
        error: "",
        authRequired: false,
      },
    }));

    try {
      const searchParams = new URLSearchParams({
        scope,
        limit: "12",
      });

      if (cursor) {
        searchParams.set("cursor", cursor);
      }

      const response = await fetch(
        `/api/posts/feed?${searchParams.toString()}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );
      const data = await readJsonResponse(response);

      if (response.status === 401 && data?.code === "AUTH_REQUIRED") {
        setFeeds((currentFeeds) => ({
          ...currentFeeds,
          [scope]: {
            ...currentFeeds[scope],
            posts: [],
            nextCursor: null,
            hasMore: false,
            loading: false,
            loadingMore: false,
            initialized: true,
            authRequired: true,
            error: "",
          },
        }));

        return;
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || "Feedul nu a putut fi încărcat."
        );
      }

      const receivedPosts = Array.isArray(data.posts) ? data.posts : [];

      setFeeds((currentFeeds) => {
        const previousPosts = cursor
          ? currentFeeds[scope].posts
          : [];
        const knownPostIds = new Set(previousPosts.map(getPostId));
        const uniquePosts = receivedPosts.filter(
          (post) => !knownPostIds.has(getPostId(post))
        );

        return {
          ...currentFeeds,
          [scope]: {
            ...currentFeeds[scope],
            posts: [...previousPosts, ...uniquePosts],
            nextCursor: data?.pagination?.nextCursor || null,
            hasMore: Boolean(data?.pagination?.hasMore),
            loading: false,
            loadingMore: false,
            initialized: true,
            authRequired: false,
            error: "",
          },
        };
      });
    } catch (error) {
      setFeeds((currentFeeds) => ({
        ...currentFeeds,
        [scope]: {
          ...currentFeeds[scope],
          loading: false,
          loadingMore: false,
          initialized: true,
          error:
            error?.message || "Feedul nu a putut fi încărcat momentan.",
        },
      }));
    }
  }, []);

  useEffect(() => {
    if (initializedScopesRef.current.has(activeScope)) {
      return;
    }

    initializedScopesRef.current.add(activeScope);
    loadFeed(activeScope);
  }, [activeScope, loadFeed]);

  const updatePostEverywhere = useCallback((postId, updater) => {
    setFeeds((currentFeeds) => {
      const nextFeeds = {};

      for (const [scope, feed] of Object.entries(currentFeeds)) {
        nextFeeds[scope] = {
          ...feed,
          posts: feed.posts.map((post) =>
            getPostId(post) === postId ? updater(post) : post
          ),
        };
      }

      return nextFeeds;
    });
  }, []);

  async function handleToggleLike(post) {
    const postId = getPostId(post);

    if (!postId || pendingLikeIds.has(postId)) {
      return;
    }

    const wasLiked = Boolean(post.isLiked);
    const previousLikesCount = Number.isFinite(post.likesCount)
      ? post.likesCount
      : 0;

    setPendingLikeIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(postId);
      return nextIds;
    });

    updatePostEverywhere(postId, (currentPost) => ({
      ...currentPost,
      isLiked: !wasLiked,
      likesCount: Math.max(
        0,
        previousLikesCount + (wasLiked ? -1 : 1)
      ),
    }));

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: wasLiked ? "DELETE" : "POST",
        credentials: "include",
      });
      const data = await readJsonResponse(response);

      if (response.status === 401) {
        throw Object.assign(
          new Error("Autentifică-te pentru a aprecia postările."),
          { authRequired: true }
        );
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || "Aprecierea nu a putut fi actualizată."
        );
      }

      updatePostEverywhere(postId, (currentPost) => ({
        ...currentPost,
        isLiked: Boolean(data.liked),
        likesCount: Number.isFinite(data.likesCount)
          ? data.likesCount
          : currentPost.likesCount,
      }));
    } catch (error) {
      updatePostEverywhere(postId, (currentPost) => ({
        ...currentPost,
        isLiked: wasLiked,
        likesCount: previousLikesCount,
      }));

      if (error?.authRequired) {
        toast.info(error.message, "Autentificare necesară");
      } else {
        toast.error(
          error?.message || "Aprecierea nu a putut fi actualizată."
        );
      }
    } finally {
      setPendingLikeIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(postId);
        return nextIds;
      });
    }
  }

  async function handleToggleSave(post) {
    const postId = getPostId(post);

    if (!postId || pendingSaveIds.has(postId)) {
      return;
    }

    const wasSaved = Boolean(post.isSaved);
    const previousSavesCount = Number.isFinite(post.savesCount)
      ? post.savesCount
      : 0;

    setPendingSaveIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(postId);
      return nextIds;
    });

    updatePostEverywhere(postId, (currentPost) => ({
      ...currentPost,
      isSaved: !wasSaved,
      savesCount: Math.max(
        0,
        previousSavesCount + (wasSaved ? -1 : 1)
      ),
    }));

    try {
      const response = await fetch(`/api/posts/${postId}/save`, {
        method: "POST",
        credentials: "include",
      });
      const data = await readJsonResponse(response);

      if (response.status === 401) {
        throw Object.assign(
          new Error("Autentifică-te pentru a salva postările."),
          { authRequired: true }
        );
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || "Postarea nu a putut fi salvată."
        );
      }

      const isSaved = Boolean(data.isSaved);

      updatePostEverywhere(postId, (currentPost) => ({
        ...currentPost,
        isSaved,
        savesCount: Math.max(
          0,
          previousSavesCount + (isSaved ? 1 : wasSaved ? -1 : 0)
        ),
      }));

      toast.success(
        isSaved
          ? "Postarea a fost adăugată la salvate."
          : "Postarea a fost eliminată din salvate."
      );
    } catch (error) {
      updatePostEverywhere(postId, (currentPost) => ({
        ...currentPost,
        isSaved: wasSaved,
        savesCount: previousSavesCount,
      }));

      if (error?.authRequired) {
        toast.info(error.message, "Autentificare necesară");
      } else {
        toast.error(
          error?.message || "Postarea nu a putut fi salvată."
        );
      }
    } finally {
      setPendingSaveIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(postId);
        return nextIds;
      });
    }
  }

  function changeScope(scope) {
    setActiveScope(scope);
  }

  function retryActiveFeed() {
    initializedScopesRef.current.add(activeScope);
    loadFeed(activeScope);
  }

  const activeFeed = feeds[activeScope];

  return (
    <main className="blog-page">
      <section className="blog-hero">
        <div className="blog-hero-copy">
          <span className="blog-eyebrow">
            <Sparkles size={16} strokeWidth={2.2} aria-hidden="true" />
            Povești și recomandări reale
          </span>

          <h1>Experiențele comunității</h1>

          <p>
            Descoperă locuri, bugete și sfaturi publicate de oameni
            care au fost deja acolo.
          </p>
        </div>

        <div className="blog-hero-mark" aria-hidden="true">
          <Compass size={42} strokeWidth={1.7} />
        </div>
      </section>

      <section className="blog-feed-shell" aria-labelledby="blog-feed-title">
        <header className="blog-feed-header">
          <div>
            <span>Feed comunitate</span>
            <h2 id="blog-feed-title">{getFeedTitle(activeScope)}</h2>
          </div>

          <div className="blog-feed-tabs" role="tablist" aria-label="Alege feedul">
            <button
              type="button"
              role="tab"
              aria-selected={activeScope === FEED_SCOPES.ALL}
              className={activeScope === FEED_SCOPES.ALL ? "active" : ""}
              onClick={() => changeScope(FEED_SCOPES.ALL)}
            >
              <UsersRound size={18} strokeWidth={2.1} aria-hidden="true" />
              Toate
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeScope === FEED_SCOPES.FOLLOWING}
              className={
                activeScope === FEED_SCOPES.FOLLOWING ? "active" : ""
              }
              onClick={() => changeScope(FEED_SCOPES.FOLLOWING)}
            >
              <UserRoundCheck
                size={18}
                strokeWidth={2.1}
                aria-hidden="true"
              />
              Urmărești
            </button>
          </div>
        </header>

        {activeFeed.loading && (
          <div className="blog-card-grid" aria-label="Se încarcă postările">
            {Array.from({ length: 6 }, (_, index) => (
              <div className="blog-card-skeleton" key={index} aria-hidden="true">
                <span />
                <div>
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            ))}
          </div>
        )}

        {!activeFeed.loading && activeFeed.authRequired && (
          <div className="blog-feed-state">
            <span className="blog-feed-state-icon">
              <UserRoundCheck size={30} strokeWidth={1.9} aria-hidden="true" />
            </span>
            <h3>Feedul tău personal este privat</h3>
            <p>
              Autentifică-te pentru a vedea experiențele publicate de
              călătorii pe care îi urmărești.
            </p>
            <div className="blog-state-actions">
              <button type="button" onClick={() => router.push("/login?next=/blog")}>
                Autentifică-te
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => router.push("/register")}
              >
                Creează cont
              </button>
            </div>
          </div>
        )}

        {!activeFeed.loading && !activeFeed.authRequired && activeFeed.error && (
          <div className="blog-feed-state blog-feed-state-error">
            <span className="blog-feed-state-icon">
              <RefreshCw size={28} strokeWidth={1.9} aria-hidden="true" />
            </span>
            <h3>Feedul nu a putut fi încărcat</h3>
            <p>{activeFeed.error}</p>
            <button type="button" onClick={retryActiveFeed}>
              Încearcă din nou
            </button>
          </div>
        )}

        {!activeFeed.loading &&
          !activeFeed.authRequired &&
          !activeFeed.error &&
          activeFeed.initialized &&
          activeFeed.posts.length === 0 && (
            <div className="blog-feed-state">
              <span className="blog-feed-state-icon">
                <Compass size={30} strokeWidth={1.9} aria-hidden="true" />
              </span>
              <h3>
                {activeScope === FEED_SCOPES.FOLLOWING
                  ? "Încă nu există postări în acest feed"
                  : "Comunitatea așteaptă prima experiență"}
              </h3>
              <p>
                {activeScope === FEED_SCOPES.FOLLOWING
                  ? "Urmărește călători noi sau revino când aceștia publică o experiență."
                  : "Publică prima poveste și ajută alți călători cu informații reale."}
              </p>
              <button
                type="button"
                onClick={() =>
                  activeScope === FEED_SCOPES.FOLLOWING
                    ? changeScope(FEED_SCOPES.ALL)
                    : router.push("/create-experience")
                }
              >
                {activeScope === FEED_SCOPES.FOLLOWING
                  ? "Explorează comunitatea"
                  : "Creează o postare"}
              </button>
            </div>
          )}

        {!activeFeed.loading && activeFeed.posts.length > 0 && (
          <>
            <div className="blog-card-grid">
              {activeFeed.posts.map((post) => {
                const postId = getPostId(post);

                return (
                  <ExperienceCard
                    key={postId}
                    post={post}
                    onToggleLike={handleToggleLike}
                    onToggleSave={handleToggleSave}
                    isLikePending={pendingLikeIds.has(postId)}
                    isSavePending={pendingSaveIds.has(postId)}
                  />
                );
              })}
            </div>

            {activeFeed.hasMore && activeFeed.nextCursor && (
              <div className="blog-load-more">
                <button
                  type="button"
                  onClick={() => loadFeed(activeScope, activeFeed.nextCursor)}
                  disabled={activeFeed.loadingMore}
                >
                  {activeFeed.loadingMore ? (
                    <RefreshCw
                      className="blog-loading-icon"
                      size={18}
                      strokeWidth={2.1}
                      aria-hidden="true"
                    />
                  ) : (
                    <ArrowDown size={18} strokeWidth={2.1} aria-hidden="true" />
                  )}
                  {activeFeed.loadingMore
                    ? "Se încarcă"
                    : "Încarcă mai multe"}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
