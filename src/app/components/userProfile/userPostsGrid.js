import Link from "next/link";

import "./userProfile.css";

function getPostId(post) {
  return post?.id || post?._id || null;
}

function getPostImage(post) {
  if (typeof post?.image === "string") {
    return post.image || null;
  }

  if (post?.image?.url) {
    return post.image.url;
  }

  if (Array.isArray(post?.images) && post.images.length > 0) {
    const firstImage = post.images[0];

    if (typeof firstImage === "string") {
      return firstImage || null;
    }

    return firstImage?.url || null;
  }

  return null;
}

function getLikesCount(post) {
  if (typeof post?.likesCount === "number") {
    return post.likesCount;
  }

  if (Array.isArray(post?.likes)) {
    return post.likes.length;
  }

  if (typeof post?.likes === "number") {
    return post.likes;
  }

  return 0;
}

function getCommentsCount(post) {
  if (typeof post?.commentsCount === "number") {
    return post.commentsCount;
  }

  if (Array.isArray(post?.comments)) {
    return post.comments.length;
  }

  if (typeof post?.comments === "number") {
    return post.comments;
  }

  return 0;
}

function getPostCost(post) {
  const rawCost =
    post?.totalCost ??
    post?.cost ??
    post?.budget ??
    null;

  if (
    rawCost === null ||
    rawCost === undefined ||
    rawCost === ""
  ) {
    return "Buget: n/a";
  }

  if (
    typeof rawCost === "number" &&
    Number.isFinite(rawCost)
  ) {
    return `Buget: ${rawCost.toLocaleString("ro-RO")} €`;
  }

  if (typeof rawCost === "string") {
    const trimmedCost = rawCost.trim();

    if (!trimmedCost) {
      return "Buget: n/a";
    }

    if (/^\d+$/.test(trimmedCost)) {
      const numericCost = Number(trimmedCost);

      return `Buget: ${numericCost.toLocaleString("ro-RO")} €`;
    }

    const firstNumber = trimmedCost.match(/\d[\d\s.,]*/)?.[0];

    if (firstNumber) {
      const numericCost = Number(
        firstNumber.replace(/[^\d]/g, "")
      );

      if (Number.isFinite(numericCost)) {
        return `Buget: ${numericCost.toLocaleString("ro-RO")} €`;
      }
    }
  }

  return "Buget: n/a";
}

export default function UserPostsGrid({ posts = [] }) {
  if (!Array.isArray(posts) || posts.length === 0) {
    return (
      <div className="profile-empty-state">
        <div className="profile-empty-icon">📷</div>

        <h3>Nu există încă postări</h3>

        <p>
          Experiențele publicate de utilizator vor apărea aici.
        </p>
      </div>
    );
  }

  return (
    <section className="user-posts-grid">
      {posts.map((post, index) => {
        const postId = getPostId(post);
        const imageUrl = getPostImage(post);
        const likesCount = getLikesCount(post);
        const commentsCount = getCommentsCount(post);
        const postCost = getPostCost(post);

        const postTitle =
          post?.title ||
          post?.destination?.name ||
          post?.destination ||
          "Experiență fără titlu";

        const postDescription =
          post?.description ||
          post?.content ||
          post?.text ||
          "Nu există încă o descriere pentru această experiență.";

        const cardContent = (
          <>
            <div className="user-post-image-wrapper">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={postTitle}
                  className="user-post-image"
                  loading="lazy"
                />
              ) : (
                <div className="user-post-image-fallback">
                  <span>Fără imagine</span>
                </div>
              )}

              {post?.category && (
                <div className="user-post-badge">
                  {typeof post.category === "string"
                    ? post.category
                    : post.category?.name}
                </div>
              )}
            </div>

            <div className="user-post-content">
              <h3>{postTitle}</h3>

              <p>{postDescription}</p>

              <div className="user-post-footer">
                <span>❤️ {likesCount}</span>

                <span>💬 {commentsCount}</span>

                <span>{postCost}</span>
              </div>
            </div>
          </>
        );

        if (!postId) {
          return (
            <article
              key={`user-post-${index}`}
              className="user-post-card"
            >
              {cardContent}
            </article>
          );
        }

        return (
          <Link
            key={postId}
            href={`/posts/${postId}`}
            className="user-post-card"
          >
            {cardContent}
          </Link>
        );
      })}
    </section>
  );
}