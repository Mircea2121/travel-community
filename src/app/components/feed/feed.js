"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./feed.css";

const initialPosts = [
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
      "Am fost la final de septembrie și a fost perfect. Vreme bună, plaje superbe și mult mai puțină aglomerație decât vara.",
    cost: "780€",
    tips: [
      "Închiriază mașină pentru plaje izolate",
      "Evită restaurantele foarte aproape de port",
      "Septembrie este o lună foarte bună",
    ],
    likes: 126,
    commentsCount: 34,
    isLiked: false,
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
      "Barcelona poate fi scumpă, dar dacă îți alegi bine zona de cazare și mănânci unde merg localnicii, ieși decent la bani.",
    cost: "430€",
    tips: [
      "Ia biletele online pentru atracții",
      "Folosește metroul",
      "Caută meniul zilei la restaurante locale",
    ],
    likes: 89,
    commentsCount: 21,
    isLiked: false,
  },
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
      "O destinație superbă, dar trebuie să fii atent la transport, zonele turistice și excursiile cumpărate de pe stradă.",
    cost: "1150€",
    tips: [
      "Negociază transportul local",
      "Nu schimba bani în aeroport",
      "Ia asigurare de călătorie",
    ],
    likes: 214,
    commentsCount: 57,
    isLiked: false,
  },
];

export default function Feed() {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);

  function handleLike(postId) {
    setPosts((currentPosts) =>
      currentPosts.map((post) => {
        if (post.id !== postId) return post;

        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
        };
      })
    );

    // Mai târziu aici apelăm backend-ul:
    // await fetch(`/api/posts/${postId}/like`, { method: "POST" });
  }

  function goToPost(postId) {
    router.push(`/posts/${postId}`);
  }

  return (
    <section className="feed-section" id="reviews">
      <div className="feed-header">
        <span>Postări recente</span>
        <h2>Experiențe reale din comunitate</h2>
        <p>
          Citește ponturi, costuri și recomandări publicate de oameni care au
          fost deja acolo.
        </p>
      </div>

      <div className="feed-list">
        {posts.map((post) => (
          <article className="post-card" key={post.id}>
            <div className="post-top">
              <div className="post-avatar">
                {post.author.avatar ? (
                  <img src={post.author.avatar} alt={post.author.name} />
                ) : (
                  post.author.name.charAt(0)
                )}
              </div>

              <div>
                <h3>{post.author.name}</h3>
                <p>{post.author.level}</p>
              </div>
            </div>

            <div className="post-location">{post.location}</div>

            <h4>{post.title}</h4>

            <p className="post-description">{post.description}</p>

            <div className="post-cost">
              <span>Cost aproximativ</span>
              <strong>{post.cost}</strong>
            </div>

            <div className="post-tips">
              <strong>Ponturi utile</strong>

              <ul>
                {post.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>

            <div className="post-actions">
              <button
                className={post.isLiked ? "active" : ""}
                onClick={() => handleLike(post.id)}
              >
                Îmi place · {post.likes}
              </button>

              <button onClick={() => goToPost(post.id)}>
                Comentarii · {post.commentsCount}
              </button>

              <button onClick={() => goToPost(post.id)}>
                Vezi postarea
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}