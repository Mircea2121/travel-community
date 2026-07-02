import Link from "next/link";
import "./userProfile.css";

export default function SavedPostsGrid({ posts = [] }) {
  if (!posts.length) {
    return (
      <div className="profile-empty-state">
        <div className="profile-empty-icon">❤️</div>
        <h3>Nu ai postări salvate</h3>
        <p>Salvează experiențele preferate ca să le găsești ușor mai târziu.</p>
      </div>
    );
  }

  return (
    <section className="user-posts-grid">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/posts/${post.id}`}
          className="user-post-card"
        >
          <div className="user-post-image-wrapper">
            <img
              src={post.image}
              alt={post.title}
              className="user-post-image"
            />

            <div className="user-post-badge">Salvat</div>
          </div>

          <div className="user-post-content">
            <h3>{post.title}</h3>
            <p>{post.description}</p>

            <div className="user-post-footer">
              <span>❤️ {post.likes || 0}</span>
              <span>💬 {post.commentsCount || 0}</span>
              <span>{post.cost || "Buget n/a"}</span>
            </div>
          </div>
        </Link>
      ))}
    </section>
  );
}