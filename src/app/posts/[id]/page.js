"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import "./postDetails.css";

const demoPosts = {
  "sardinia-italia-780": {
    id: "sardinia-italia-780",
    author: {
      name: "Andreea",
      level: "Explorator",
      avatar: "",
    },
    location: "Sardinia, Italia",
    title: "5 zile în Sardinia cu 780€",
    description:
      "Am fost la final de septembrie și a fost perfect. Vreme bună, plaje superbe și mult mai puțină aglomerație decât vara. Am închiriat mașină și am reușit să vedem plaje superbe care nu sunt foarte ușor accesibile fără transport.",
    cost: {
      total: "780€",
      transport: "180€",
      cazare: "360€",
      mancare: "140€",
      activitati: "100€",
    },
    tips: [
      "Închiriază mașină pentru plaje izolate.",
      "Evită restaurantele foarte aproape de port.",
      "Septembrie este o lună foarte bună pentru plajă.",
      "Ia apă și gustări dacă mergi la plaje mai retrase.",
    ],
    likes: 126,
    comments: [
      {
        id: 1,
        author: "Mihai",
        text: "Merită mers în octombrie sau e prea târziu pentru plajă?",
        replies: [
          {
            id: 101,
            author: "Andreea",
            text: "Începutul lui octombrie poate fi ok, dar depinde mult de vreme.",
          },
        ],
      },
      {
        id: 2,
        author: "Ioana",
        text: "Ai nevoie neapărat de mașină sau merge și cu transport public?",
        replies: [],
      },
    ],
  },
  "barcelona-spania-city-break": {
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
    cost: {
      total: "430€",
      transport: "120€",
      cazare: "180€",
      mancare: "90€",
      activitati: "40€",
    },
    tips: [
      "Ia biletele online pentru atracții.",
      "Folosește metroul.",
      "Caută meniul zilei la restaurante locale.",
    ],
    likes: 89,
    comments: [],
  },
  "thailanda-prima-data": {
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
    cost: {
      total: "1150€",
      transport: "520€",
      cazare: "310€",
      mancare: "180€",
      activitati: "140€",
    },
    tips: [
      "Negociază transportul local.",
      "Nu schimba bani în aeroport.",
      "Ia asigurare de călătorie.",
    ],
    likes: 214,
    comments: [],
  },
};

export default function PostDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const post = demoPosts[id];

  const [comments, setComments] = useState(post?.comments || []);
  const [commentText, setCommentText] = useState("");
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyText, setReplyText] = useState("");

  if (!post) {
    return (
      <section className="post-details-page">
        <div className="post-details-container">
          <button className="back-button" onClick={() => router.push("/")}>
            Înapoi la homepage
          </button>
          <h1>Postarea nu a fost găsită.</h1>
        </div>
      </section>
    );
  }

  function handleAddComment(e) {
    e.preventDefault();

    if (!commentText.trim()) return;

    const newComment = {
      id: Date.now(),
      author: "Utilizator demo",
      text: commentText,
      replies: [],
    };

    setComments((prevComments) => [...prevComments, newComment]);
    setCommentText("");
  }

  function handleAddReply(e, commentId) {
    e.preventDefault();

    if (!replyText.trim()) return;

    const newReply = {
      id: Date.now(),
      author: "Utilizator demo",
      text: replyText,
    };

    setComments((prevComments) =>
      prevComments.map((comment) => {
        if (comment.id !== commentId) return comment;

        return {
          ...comment,
          replies: [...comment.replies, newReply],
        };
      })
    );

    setReplyText("");
    setActiveReplyId(null);
  }

  return (
    <section className="post-details-page">
      <div className="post-details-container">
        <button className="back-button" onClick={() => router.push("/")}>
          Înapoi
        </button>

        <article className="post-details-card">
          <div className="post-details-author">
            <div className="post-details-avatar">
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

          <span className="post-details-location">{post.location}</span>

          <h1>{post.title}</h1>

          <p className="post-details-description">{post.description}</p>

          <div className="cost-box">
            <div className="cost-total">
              <span>Cost total aproximativ</span>
              <strong>{post.cost.total}</strong>
            </div>

            <div className="cost-grid">
              <div>
                <span>Transport</span>
                <strong>{post.cost.transport}</strong>
              </div>

              <div>
                <span>Cazare</span>
                <strong>{post.cost.cazare}</strong>
              </div>

              <div>
                <span>Mâncare</span>
                <strong>{post.cost.mancare}</strong>
              </div>

              <div>
                <span>Activități</span>
                <strong>{post.cost.activitati}</strong>
              </div>
            </div>
          </div>

          <div className="tips-box">
            <h2>Ponturi utile</h2>

            <ul>
              {post.tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>

          <div className="comments-box">
            <h2>Comentarii și întrebări</h2>

            <div className="comments-list">
              {comments.length === 0 ? (
                <p className="no-comments">
                  Nu există comentarii încă. Fii primul care întreabă ceva.
                </p>
              ) : (
                comments.map((comment) => (
                  <div className="comment-thread" key={comment.id}>
                    <div className="comment-card">
                      <strong>{comment.author}</strong>
                      <p>{comment.text}</p>

                      <button
                        className="reply-button"
                        onClick={() =>
                          setActiveReplyId(
                            activeReplyId === comment.id ? null : comment.id
                          )
                        }
                      >
                        Răspunde
                      </button>
                    </div>

                    {comment.replies.length > 0 && (
                      <div className="replies-list">
                        {comment.replies.map((reply) => (
                          <div className="reply-card" key={reply.id}>
                            <strong>{reply.author}</strong>
                            <p>{reply.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeReplyId === comment.id && (
                      <form
                        className="reply-form"
                        onSubmit={(e) => handleAddReply(e, comment.id)}
                      >
                        <textarea
                          placeholder="Scrie un răspuns..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                        ></textarea>

                        <button type="submit">Trimite răspunsul</button>
                      </form>
                    )}
                  </div>
                ))
              )}
            </div>

            <form className="comment-form" onSubmit={handleAddComment}>
              <textarea
                placeholder="Scrie un comentariu sau pune o întrebare..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              ></textarea>

              <button type="submit">Trimite comentariul</button>
            </form>
          </div>
        </article>
      </div>
    </section>
  );
}