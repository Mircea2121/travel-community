"use client";

import "./hero.css";
import { MapPinned,Star,Users, ArrowRight, } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";


const fallbackFeaturedPosts = [
  {
    id: "featured-post-1",
    text: "Cea mai frumoasă experiență din viața mea!",
    destination: "Sardinia, Italia",
    likesCount: 1254,
    commentsCount: 218,
    user: {
      id: "user-1",
      name: "Andreea",
      avatar:
        "https://randomuser.me/api/portraits/women/44.jpg",
    },
  },
  {
    id: "featured-post-2",
    text: "Santorini este și mai frumos decât mi-am imaginat.",
    destination: "Santorini, Grecia",
    likesCount: 1086,
    commentsCount: 174,
    user: {
      id: "user-2",
      name: "Mihai",
      avatar:
        "https://randomuser.me/api/portraits/men/32.jpg",
    },
  },
  {
    id: "featured-post-3",
    text: "Un loc spectaculos în care m-aș întoarce oricând.",
    destination: "Madeira, Portugalia",
    likesCount: 947,
    commentsCount: 136,
    user: {
      id: "user-3",
      name: "Ioana",
      avatar:
        "https://randomuser.me/api/portraits/women/68.jpg",
    },
  },
  {
    id: "featured-post-4",
    text: "O vacanță care mi-a depășit toate așteptările.",
    destination: "Dolomiți, Italia",
    likesCount: 821,
    commentsCount: 109,
    user: {
      id: "user-4",
      name: "Alex",
      avatar:
        "https://randomuser.me/api/portraits/men/75.jpg",
    },
  },
];

const activeUsers = [
  {
    id: 1,
    name: "Andreea",
    avatar:
      "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: 2,
    name: "Mihai",
    avatar:
      "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: 3,
    name: "Ioana",
    avatar:
      "https://randomuser.me/api/portraits/women/68.jpg",
  },
  {
    id: 4,
    name: "Alex",
    avatar:
      "https://randomuser.me/api/portraits/men/75.jpg",
  },
];

export default function Hero() {
  const router = useRouter();

  const [featuredPosts, setFeaturedPosts] = useState(
    fallbackFeaturedPosts
  );

  const [activePostIndex, setActivePostIndex] =
    useState(0);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      return;
    }

    const controller = new AbortController();

    const loadFeaturedPosts = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/api/posts/featured?limit=4`,
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

        const receivedPosts = Array.isArray(data)
          ? data
          : data.posts;

        if (
          Array.isArray(receivedPosts) &&
          receivedPosts.length > 0
        ) {
          setFeaturedPosts(receivedPosts);
          setActivePostIndex(0);
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

    const sliderInterval = window.setInterval(() => {
      setActivePostIndex((currentIndex) => {
        return (
          (currentIndex + 1) %
          featuredPosts.length
        );
      });
    }, 5000);

    return () => {
      window.clearInterval(sliderInterval);
    };
  }, [featuredPosts.length]);

  const openPost = (post) => {
    const postId = post.id ?? post._id;

    if (!postId) {
      return;
    }

    router.push(`/posts/${postId}`);
  };

  return (
    <section className="hero" id="hero">
      <div className="hero-overlay" />

      <div className="hero-container">
        <div className="hero-left">
          <div className="hero-badge">
            <Users
              size={17}
              strokeWidth={2.2}
            />

            <span>
              Comunitate pentru românii care călătoresc
            </span>
          </div>

          <h1>
            Descoperă lumea prin
            <span> experiențe reale.</span>
          </h1>

          <p className="hero-description">
            Postează fotografii, lasă recenzii, cere păreri
            și ajută alți români să aleagă următoarea
            destinație.
          </p>

          <div className="hero-buttons">
            <button
              type="button"
              className="hero-primary"
              onClick={() => router.push("/login")}
            >
              <span>Intră în comunitate</span>
            </button>

            <button
              type="button"
              className="hero-secondary"
              onClick={() =>
                scrollToSection("destinations")
              }
            >
              <MapPinned
                size={20}
                strokeWidth={2.2}
              />

              <span>Explorează destinații</span>
            </button>
          </div>

          <div className="hero-social">
            <div className="hero-avatars">
              {activeUsers.map((user) => (
                <img
                  key={user.id}
                  src={user.avatar}
                  alt={`Avatar ${user.name}`}
                  title={user.name}
                />
              ))}

              <strong>2.5K+</strong>
            </div>

            <div className="hero-social-info">
              <p>Călători activi în comunitate</p>

              <div className="hero-rating">
                <div className="hero-stars">
                  <Star size={15} fill="currentColor" />
                  <Star size={15} fill="currentColor" />
                  <Star size={15} fill="currentColor" />
                  <Star size={15} fill="currentColor" />
                  <Star size={15} fill="currentColor" />
                </div>

                <strong>4.8/5</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-review-slider">
          <div
            className="hero-review-track"
            style={{
              transform: `translateX(-${activePostIndex * 100}%)`,
            }}
          >
            {featuredPosts.map((post, index) => {
              const postText =
                post.text ??
                post.description ??
                post.content ??
                "Descoperă o nouă experiență de călătorie.";

              const postDestination =
                post.destination?.name ??
                post.destination ??
                post.location ??
                "Destinație";

              const postUser =
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
                  onClick={() => openPost(post)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
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
                    <strong>{userName}</strong>
                    <span>{postDestination}</span>
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
                  <span>Vezi postarea</span>

                  <ArrowRight
                    size={16}
                    strokeWidth={2.3}
                  />
                </button>
                </article>
              );
            })}
          </div>

          <div className="review-dots">
            {featuredPosts.map((post, index) => (
              <button
                key={
                  post.id ??
                  post._id ??
                  `featured-dot-${index}`
                }
                type="button"
                className={
                  index === activePostIndex
                    ? "review-dot review-dot-active"
                    : "review-dot"
                }
                onClick={() =>
                  setActivePostIndex(index)
                }
                aria-label={`Afișează postarea ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="hero-scroll-indicator">
        <span>Descoperă mai mult</span>
        <div />
      </div>
    </section>
  );
}