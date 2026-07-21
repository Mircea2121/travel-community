"use client";

import { useMemo, useState } from "react";
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

const initialPosts = [
  {
    id: "thailanda-prima-data",
    author: {
      name: "Raluca",
      level: "Veteran călător",
      avatar: "",
    },
    location: "Thailanda",
    title: "Thailanda pentru prima dată: ce aș fi vrut să știu",
    description:
      "Transport, zone turistice, excursii și greșelile pe care le poți evita la prima călătorie în Thailanda.",
    cost: "1.150€",
    image:
      "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=82",
    likes: 214,
    commentsCount: 57,
    saves: 96,
    category: "Aventură",
    isLiked: false,
    isSaved: false,
  },
  {
    id: "sardinia-italia-780",
    author: {
      name: "Andreea",
      level: "Explorator",
      avatar: "",
    },
    location: "Sardinia, Italia",
    title: "5 zile în Sardinia cu 780€",
    description:
      "Plaje spectaculoase, mai puțină aglomerație și un buget complet pentru o vacanță la final de septembrie.",
    cost: "780€",
    image:
      "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?auto=format&fit=crop&w=1200&q=82",
    likes: 126,
    commentsCount: 34,
    saves: 71,
    category: "Plajă",
    isLiked: false,
    isSaved: false,
  },
  {
    id: "barcelona-spania-city-break",
    author: {
      name: "Mihai",
      level: "Călător activ",
      avatar: "",
    },
    location: "Barcelona, Spania",
    title: "City break în Barcelona fără să cheltui mult",
    description:
      "Cum alegi cazarea, unde mănâncă localnicii și ce bilete merită cumpărate în avans.",
    cost: "430€",
    image:
      "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=1200&q=82",
    likes: 89,
    commentsCount: 21,
    saves: 54,
    category: "City break",
    isLiked: false,
    isSaved: false,
  },
  {
    id: "islanda-road-trip",
    author: {
      name: "Vlad",
      level: "Explorator avansat",
      avatar: "",
    },
    location: "Islanda",
    title: "Road trip de 7 zile prin Islanda",
    description:
      "Traseul complet, costurile pentru mașină și cazare, plus locurile care merită cu adevărat oprirea.",
    cost: "1.480€",
    image:
      "https://images.unsplash.com/photo-1504829857797-ddff29c27927?auto=format&fit=crop&w=1200&q=82",
    likes: 178,
    commentsCount: 46,
    saves: 88,
    category: "Road trip",
    isLiked: false,
    isSaved: false,
  },
  {
    id: "maldive-buget-realist",
    author: {
      name: "Ioana",
      level: "Călător activ",
      avatar: "",
    },
    location: "Maldive",
    title: "Maldive cu un buget realist, fără resort de lux",
    description:
      "Insule locale, transport între atoluri și costurile reale pentru o vacanță tropicală bine organizată.",
    cost: "1.320€",
    image:
      "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=82",
    likes: 157,
    commentsCount: 39,
    saves: 83,
    category: "Exotic",
    isLiked: false,
    isSaved: false,
  },
  {
    id: "lisabona-weekend",
    author: {
      name: "Cristina",
      level: "Explorator",
      avatar: "",
    },
    location: "Lisabona, Portugalia",
    title: "Un weekend complet în Lisabona",
    description:
      "Cartiere, puncte panoramice, transport și restaurante bune pentru un city break scurt și relaxat.",
    cost: "390€",
    image:
      "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=76",
    likes: 103,
    commentsCount: 27,
    saves: 49,
    category: "City break",
    isLiked: false,
    isSaved: false,
  },
];

function getRecommendationScore(post) {
  return post.likes * 1 + post.commentsCount * 2 + post.saves * 1.5;
}

export default function Feed() {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);

  const recommendedPosts = useMemo(() => {
    return [...posts]
      .sort(
        (firstPost, secondPost) =>
          getRecommendationScore(secondPost) -
          getRecommendationScore(firstPost)
      )
      .slice(0, 6);
  }, [posts]);

  function handleLike(postId) {
    setPosts((currentPosts) =>
      currentPosts.map((post) => {
        if (post.id !== postId) {
          return post;
        }

        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
        };
      })
    );
  }

  function handleSave(postId) {
    setPosts((currentPosts) =>
      currentPosts.map((post) => {
        if (post.id !== postId) {
          return post;
        }

        return {
          ...post,
          isSaved: !post.isSaved,
          saves: post.isSaved ? post.saves - 1 : post.saves + 1,
        };
      })
    );
  }

  function goToPost(postId) {
    router.push(`/posts/${postId}`);
  }

  function goToBlog() {
    router.push("/blog");
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
          Descoperă postările care au primit cele mai multe aprecieri,
          comentarii și salvări din partea călătorilor.
        </p>
      </div>

      <div className="feed-list">
        {recommendedPosts.map((post) => (
          <article className="post-card" key={post.id}>
            <button
              type="button"
              className="post-image-button"
              onClick={() => goToPost(post.id)}
              aria-label={`Vezi experiența: ${post.title}`}
            >
              <img
                className="post-image"
                src={post.image}
                alt={post.location}
                loading="lazy"
              />

              <span className="post-image-overlay" />

              <span className="post-category">
                {post.category}
              </span>

              <span className="post-cost">
                de la <strong>{post.cost}</strong>
              </span>
            </button>

            <div className="post-card-content">
              <div className="post-author-row">
                <div className="post-author">
                  <div className="post-avatar">
                    {post.author.avatar ? (
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                      />
                    ) : (
                      post.author.name.charAt(0)
                    )}
                  </div>

                  <div>
                    <h3>{post.author.name}</h3>
                    <p>{post.author.level}</p>
                  </div>
                </div>

                <button
                  type="button"
                  className={`post-save-button ${
                    post.isSaved ? "active" : ""
                  }`}
                  onClick={() => handleSave(post.id)}
                  aria-label={
                    post.isSaved
                      ? "Elimină postarea din salvate"
                      : "Salvează postarea"
                  }
                >
                  <Bookmark
                    size={19}
                    strokeWidth={2.1}
                    fill={post.isSaved ? "currentColor" : "none"}
                  />
                </button>
              </div>

              <div className="post-location">
                <MapPin size={15} strokeWidth={2.3} />
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
                    onClick={() => handleLike(post.id)}
                    aria-label={
                      post.isLiked
                        ? "Retrage aprecierea"
                        : "Apreciază postarea"
                    }
                  >
                    <Heart
                      size={18}
                      strokeWidth={2.1}
                      fill={post.isLiked ? "currentColor" : "none"}
                    />

                    <span>{post.likes}</span>
                  </button>

                  <button
                    type="button"
                    className="post-engagement-button"
                    onClick={() => goToPost(post.id)}
                    aria-label="Vezi comentariile"
                  >
                    <MessageCircle size={18} strokeWidth={2.1} />
                    <span>{post.commentsCount}</span>
                  </button>

                  <div
                    className="post-saves-count"
                    title={`${post.saves} salvări`}
                  >
                    <Bookmark size={17} strokeWidth={2.1} />
                    <span>{post.saves}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="post-view-button"
                  onClick={() => goToPost(post.id)}
                >
                  Vezi experiența
                  <ArrowRight size={17} strokeWidth={2.2} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="feed-blog-cta">
        <div>
          <span>Mai sunt multe de descoperit</span>

          <h3>Explorează toate experiențele comunității</h3>

          <p>
            Intră în Blog pentru a vedea toate postările, destinațiile și
            recomandările publicate de călători.
          </p>
        </div>

        <button type="button" onClick={goToBlog}>
          Vezi toate postările
          <ArrowRight size={19} strokeWidth={2.3} />
        </button>
      </div>
    </section>
  );
}