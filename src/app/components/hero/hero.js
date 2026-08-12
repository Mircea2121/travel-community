"use client";

import "./hero.css";

import {
  MapPinned,
  Users,
  ArrowRight,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();

  const [featuredPosts, setFeaturedPosts] = useState([]);

  const [activePostIndex, setActivePostIndex] =
    useState(0);

  const [user, setUser] = useState(null);

  const [isLoadingUser, setIsLoadingUser] =
    useState(true);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const response = await fetch(
          "/api/auth/me",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          if (isMounted) {
            setUser(null);
          }

          return;
        }

        const data = await response.json();

        if (!isMounted) {
          return;
        }

        if (data?.success && data?.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoadingUser(false);
        }
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const controller =
      new AbortController();

    const loadFeaturedPosts = async () => {
      try {
        const response = await fetch(
          "/api/posts/popular?limit=4",
          {
            method: "GET",
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Postările apreciate nu au putut fi încărcate."
          );
        }

        const data = await response.json();

        const receivedPosts = Array.isArray(data?.posts) ? data.posts : [];

        if (
          Array.isArray(receivedPosts) &&
          receivedPosts.length > 0
        ) {
          setFeaturedPosts(receivedPosts);
          setActivePostIndex(0);
        } else {
          setFeaturedPosts([]);
        }
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        console.error(error);
      }
    };

    loadFeaturedPosts();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (featuredPosts.length <= 1) {
      return;
    }

    const sliderInterval =
      window.setInterval(() => {
        setActivePostIndex(
          (currentIndex) => {
            return (
              (currentIndex + 1) %
              featuredPosts.length
            );
          }
        );
      }, 5000);

    return () => {
      window.clearInterval(sliderInterval);
    };
  }, [featuredPosts.length]);

  const openPost = (post) => {
    const postId =
      post.id ?? post._id;

    if (!postId) {
      return;
    }

    router.push(`/posts/${postId}`);
  };

  function handleCommunityClick() {
    if (isLoadingUser) {
      return;
    }

    router.push(
      user ? "/profile" : "/register"
    );
  }

  return (
    <section
      className="hero"
      id="hero"
    >
      <div className="hero-overlay" />

      <div className="hero-container">
        <div className="hero-left">
          <div className="hero-badge">
            <Users
              size={17}
              strokeWidth={2.2}
            />

            <span>
              Comunitate pentru românii care
              călătoresc
            </span>
          </div>

          <h1>
            Descoperă lumea prin
            <span> experiențe reale.</span>
          </h1>

          <p className="hero-description">
            Postează fotografii, lasă
            recenzii, cere păreri și ajută
            alți români să aleagă următoarea
            destinație.
          </p>

          <div className="hero-buttons">
            <button
              type="button"
              className="hero-primary"
              onClick={
                handleCommunityClick
              }
              disabled={isLoadingUser}
            >
              <span>
                Intră în comunitate
              </span>
            </button>

            <button
              type="button"
              className="hero-secondary"
              onClick={() =>
                scrollToSection(
                  "destinations"
                )
              }
            >
              <MapPinned
                size={20}
                strokeWidth={2.2}
              />

              <span>
                Explorează destinații
              </span>
            </button>
          </div>

        </div>

        <div className="hero-review-slider">
          <div
            className="hero-review-track"
            style={{
              transform: `translateX(-${
                activePostIndex * 100
              }%)`,
            }}
          >
            {featuredPosts.map(
              (post, index) => {
                const postText =
                  post.title ??
                  post.text ??
                  post.description ??
                  post.content ??
                  "Descoperă o nouă experiență de călătorie.";

                const postDestination =
                  [post.city, post.country].filter(Boolean).join(", ") ||
                  post.destination?.name ||
                  post.destination ||
                  post.location ||
                  "Destinație";

                const postUser =
                  (post.name || post.username || post.avatar
                    ? {
                        name: post.name,
                        username: post.username,
                        avatar: post.avatar,
                      }
                    : null) ??
                  post.user ??
                  post.author ?? {
                    name: "Călător",
                    avatar: "",
                  };

                const userName =
                  postUser.name ??
                  postUser.username ??
                  "Călător";

                const userAvatar =
                  postUser.avatar?.url ??
                  postUser.avatar ??
                  postUser.profileImage ??
                  "https://randomuser.me/api/portraits/lego/1.jpg";

                return (
                  <article
                    key={
                      post.id ??
                      post._id ??
                      `featured-post-${index}`
                    }
                    className="hero-review-card"
                    onClick={() =>
                      openPost(post)
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                          "Enter" ||
                        event.key === " "
                      ) {
                        openPost(post);
                      }
                    }}
                  >
                    <div className="hero-review-mark">
                      “
                    </div>

                    <p>{postText}</p>

                    <div className="hero-review-user">
                      <img
                        src={userAvatar}
                        alt={`Avatar ${userName}`}
                      />

                      <div>
                        <strong>
                          {userName}
                        </strong>

                        <span>
                          {postDestination}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="hero-review-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openPost(post);
                      }}
                    >
                      <span>
                        Vezi postarea
                      </span>

                      <ArrowRight
                        size={16}
                        strokeWidth={2.3}
                      />
                    </button>
                  </article>
                );
              }
            )}
          </div>

          <div className="review-dots">
            {featuredPosts.map(
              (post, index) => (
                <button
                  key={
                    post.id ??
                    post._id ??
                    `featured-dot-${index}`
                  }
                  type="button"
                  className={
                    index ===
                    activePostIndex
                      ? "review-dot review-dot-active"
                      : "review-dot"
                  }
                  onClick={() =>
                    setActivePostIndex(
                      index
                    )
                  }
                  aria-label={`Afișează postarea ${
                    index + 1
                  }`}
                />
              )
            )}
          </div>
        </div>
      </div>

      <div className="hero-scroll-indicator">
        <span>
          Descoperă mai mult
        </span>

        <div />
      </div>
    </section>
  );
}
