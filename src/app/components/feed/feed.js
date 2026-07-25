"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bookmark,
  Heart,
  MapPin,
  MessageCircle,
  TrendingUp,
} from "lucide-react";

import "./feed.css";

const CATEGORY_LABELS = {
  plaja: "Plajă",
  "city-break": "City break",
  munte: "Munte",
  mancare: "Mâncare",
  aventura: "Aventură",
  cultura: "Cultură",
  familie: "Familie",
  "buget-redus": "Buget redus",
};

function getPostId(post) {
  return post?._id || post?.id || "";
}

function getPostImage(post) {
  if (!Array.isArray(post?.images) || post.images.length === 0) {
    return "";
  }

  const firstImage = post.images[0];

  if (typeof firstImage === "string") {
    return firstImage;
  }

  return firstImage?.url || "";
}

function getAvatarUrl(avatar) {
  if (typeof avatar === "string") {
    return avatar;
  }

  if (
    avatar &&
    typeof avatar === "object" &&
    typeof avatar.url === "string"
  ) {
    return avatar.url;
  }

  return "";
}

function getLocation(post) {
  const locationParts = [];

  if (post?.destination) {
    locationParts.push(post.destination);
  }

  if (
    post?.city &&
    post.city.toLowerCase() !== post.destination?.toLowerCase()
  ) {
    locationParts.push(post.city);
  }

  if (
    post?.country &&
    post.country.toLowerCase() !== post.destination?.toLowerCase()
  ) {
    locationParts.push(post.country);
  }

  return locationParts.join(", ");
}

function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || category || "Călătorie";
}

function getLikesCount(post) {
  return typeof post?.likesCount === "number"
    ? post.likesCount
    : 0;
}

function getCommentsCount(post) {
  return typeof post?.commentsCount === "number"
    ? post.commentsCount
    : 0;
}

function getSavesCount(post) {
  return typeof post?.savesCount === "number"
    ? post.savesCount
    : 0;
}

function getRecommendationScore(post) {
  const likesCount = getLikesCount(post);
  const commentsCount = getCommentsCount(post);
  const savesCount = getSavesCount(post);

  return (
    likesCount +
    commentsCount * 2 +
    savesCount * 1.5
  );
}

function normalizePost(post) {
  return {
    ...post,

    id: getPostId(post),
    image: getPostImage(post),

    author: {
      name:
        post?.name ||
        post?.username ||
        "Utilizator",

      username: post?.username || "",

      avatar: getAvatarUrl(post?.avatar),
    },

    location:
      getLocation(post) ||
      "Destinație nespecificată",

    category: getCategoryLabel(post?.category),

    cost:
      post?.totalCost ||
      "Cost nespecificat",

    likesCount: getLikesCount(post),
    commentsCount: getCommentsCount(post),
    savesCount: getSavesCount(post),

    isLiked: Boolean(post?.isLiked),
    isSaved: Boolean(post?.isSaved),
  };
}

export default function Feed() {
  const router = useRouter();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadPosts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/posts?limit=20",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data?.success) {
          throw new Error(
            data?.message ||
              "Postările nu au putut fi încărcate."
          );
        }

        if (!isMounted) {
          return;
        }

        const normalizedPosts = Array.isArray(data.posts)
          ? data.posts.map(normalizePost)
          : [];

        setPosts(normalizedPosts);
      } catch (fetchError) {
        console.error(
          "Eroare la încărcarea feed-ului:",
          fetchError
        );

        if (!isMounted) {
          return;
        }

        setError(
          fetchError?.message ||
            "A apărut o eroare la încărcarea postărilor."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  const recommendedPosts = useMemo(() => {
    return [...posts]
      .sort((firstPost, secondPost) => {
        const scoreDifference =
          getRecommendationScore(secondPost) -
          getRecommendationScore(firstPost);

        if (scoreDifference !== 0) {
          return scoreDifference;
        }

        return (
          new Date(secondPost.createdAt).getTime() -
          new Date(firstPost.createdAt).getTime()
        );
      })
      .slice(0, 6);
  }, [posts]);

  function goToPost(postId) {
    if (!postId) {
      return;
    }

    router.push(`/posts/${postId}`);
  }

  function goToProfile(username) {
    if (!username) {
      return;
    }

    router.push(`/users/${username}`);
  }

  function goToBlog() {
    router.push("/blog");
  }

  function handlePendingLike() {
    console.log(
      "Like-urile vor fi conectate la backend în următorul pas."
    );
  }

  function handlePendingSave() {
    console.log(
      "Postările salvate vor fi conectate la backend ulterior."
    );
  }

  return (
    <section className="feed-section" id="reviews">
      <div className="feed-header">
        <span className="feed-eyebrow">
          <TrendingUp size={16} strokeWidth={2.3} />
          Recomandate de comunitate
        </span>

        <h2>Cele mai apreciate experiențe</h2>

        <p>
          Descoperă cele mai noi experiențe publicate de
          călători, iar pe măsură ce apar aprecieri și
          comentarii, cele mai populare vor urca în feed.
        </p>
      </div>

      {loading && (
        <div className="feed-status">
          <div className="feed-status-icon">⏳</div>

          <h3>Se încarcă experiențele</h3>

          <p>
            Pregătim cele mai noi postări ale comunității.
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="feed-status feed-status-error">
          <div className="feed-status-icon">⚠️</div>

          <h3>Feed-ul nu a putut fi încărcat</h3>

          <p>{error}</p>
        </div>
      )}

      {!loading &&
        !error &&
        recommendedPosts.length === 0 && (
          <div className="feed-status">
            <div className="feed-status-icon">🌍</div>

            <h3>Nu există încă experiențe</h3>

            <p>
              Prima experiență publicată va apărea automat
              aici.
            </p>
          </div>
        )}

      {!loading &&
        !error &&
        recommendedPosts.length > 0 && (
          <div className="feed-list">
            {recommendedPosts.map((post) => (
              <article
                className="post-card"
                key={post.id}
              >
                <button
                  type="button"
                  className="post-image-button"
                  onClick={() => goToPost(post.id)}
                  aria-label={`Vezi experiența: ${post.title}`}
                >
                  {post.image ? (
                    <img
                      className="post-image"
                      src={post.image}
                      alt={post.location}
                      loading="lazy"
                    />
                  ) : (
                    <div className="post-image-fallback">
                      <span>Fără imagine</span>
                    </div>
                  )}

                  <span className="post-image-overlay" />

                  <span className="post-category">
                    {post.category}
                  </span>

                  <span className="post-cost">
                    cost{" "}
                    <strong>{post.cost}</strong>
                  </span>
                </button>

                <div className="post-card-content">
                  <div className="post-author-row">
                    <button
                      type="button"
                      className="post-author post-author-button"
                      onClick={() =>
                        goToProfile(post.author.username)
                      }
                      aria-label={`Vezi profilul lui ${post.author.name}`}
                    >
                      <div className="post-avatar">
                        {post.author.avatar ? (
                          <img
                            src={post.author.avatar}
                            alt={post.author.name}
                          />
                        ) : (
                          post.author.name
                            .charAt(0)
                            .toUpperCase()
                        )}
                      </div>

                      <div>
                        <h3>{post.author.name}</h3>

                        <p>
                          {post.author.username
                            ? `@${post.author.username}`
                            : "Călător"}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`post-save-button ${
                        post.isSaved ? "active" : ""
                      }`}
                      onClick={handlePendingSave}
                      aria-label="Salvează postarea"
                      title="Salvările vor fi conectate în curând"
                    >
                      <Bookmark
                        size={19}
                        strokeWidth={2.1}
                        fill={
                          post.isSaved
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  </div>

                  <div className="post-location">
                    <MapPin
                      size={15}
                      strokeWidth={2.3}
                    />

                    {post.location}
                  </div>

                  <button
                    type="button"
                    className="post-title-button"
                    onClick={() => goToPost(post.id)}
                  >
                    {post.title}
                  </button>

                  <p className="post-description">
                    {post.description}
                  </p>

                  <div className="post-card-footer">
                    <div className="post-engagement">
                      <button
                        type="button"
                        className={`post-engagement-button ${
                          post.isLiked ? "active" : ""
                        }`}
                        onClick={handlePendingLike}
                        aria-label="Apreciază postarea"
                        title="Like-urile vor fi conectate în următorul pas"
                      >
                        <Heart
                          size={18}
                          strokeWidth={2.1}
                          fill={
                            post.isLiked
                              ? "currentColor"
                              : "none"
                          }
                        />

                        <span>
                          {post.likesCount}
                        </span>
                      </button>

                      <button
                        type="button"
                        className="post-engagement-button"
                        onClick={() =>
                          goToPost(post.id)
                        }
                        aria-label="Vezi comentariile"
                      >
                        <MessageCircle
                          size={18}
                          strokeWidth={2.1}
                        />

                        <span>
                          {post.commentsCount}
                        </span>
                      </button>

                      <div
                        className="post-saves-count"
                        title={`${post.savesCount} salvări`}
                      >
                        <Bookmark
                          size={17}
                          strokeWidth={2.1}
                        />

                        <span>
                          {post.savesCount}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="post-view-button"
                      onClick={() =>
                        goToPost(post.id)
                      }
                    >
                      Vezi experiența

                      <ArrowRight
                        size={17}
                        strokeWidth={2.2}
                      />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

      <div className="feed-blog-cta">
        <div>
          <span>Mai sunt multe de descoperit</span>

          <h3>
            Explorează toate experiențele comunității
          </h3>

          <p>
            Intră în Blog pentru a vedea toate postările,
            destinațiile și recomandările publicate de
            călători.
          </p>
        </div>

        <button type="button" onClick={goToBlog}>
          Vezi toate postările

          <ArrowRight
            size={19}
            strokeWidth={2.3}
          />
        </button>
      </div>
    </section>
  );
}