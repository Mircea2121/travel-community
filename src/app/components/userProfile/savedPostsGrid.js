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

  if (
    Array.isArray(post?.images) &&
    post.images.length > 0
  ) {
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

  return 0;
}

function getCommentsCount(post) {
  if (
    typeof post?.commentsCount === "number"
  ) {
    return post.commentsCount;
  }

  if (Array.isArray(post?.comments)) {
    return post.comments.length;
  }

  return 0;
}

function formatCategory(category) {
  const categoryLabels = {
    plaja: "Plajă",
    "city-break": "City break",
    munte: "Munte",
    mancare: "Mâncare",
    aventura: "Aventură",
    cultura: "Cultură",
    familie: "Familie",
    "buget-redus": "Buget redus",
  };

  return categoryLabels[category] || category;
}

function formatBudget(post) {
  const rawBudget =
    post?.totalCost ??
    post?.budget ??
    post?.cost ??
    null;

  if (
    rawBudget === null ||
    rawBudget === undefined ||
    rawBudget === ""
  ) {
    return "Buget nespecificat";
  }

  const budgetText = String(rawBudget).trim();

  if (budgetText.includes("€")) {
    return `Buget: ${budgetText}`;
  }

  return `Buget: ${budgetText} €`;
}

export default function SavedPostsGrid({
  posts = [],
}) {
  if (
    !Array.isArray(posts) ||
    posts.length === 0
  ) {
    return (
      <div className="profile-empty-state">
        <div className="profile-empty-icon">
          🔖
        </div>

        <h3>
          Nu există încă postări salvate
        </h3>

        <p>
          Postările pe care le salvezi vor
          apărea aici.
        </p>
      </div>
    );
  }

  return (
    <section className="user-posts-grid">
      {posts.map((post, index) => {
        const postId = getPostId(post);
        const imageUrl = getPostImage(post);

        const likesCount =
          getLikesCount(post);

        const commentsCount =
          getCommentsCount(post);

        const postTitle =
          post?.title ||
          post?.destination ||
          "Experiență fără titlu";

        const postDescription =
          post?.description ||
          "Nu există încă o descriere pentru această experiență.";

        const postBudget =
          formatBudget(post);

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
                  <span>
                    Fără imagine
                  </span>
                </div>
              )}

              {post?.category && (
                <div className="user-post-badge">
                  {formatCategory(
                    post.category
                  )}
                </div>
              )}
            </div>

            <div className="user-post-content">
              <h3>{postTitle}</h3>

              <p>{postDescription}</p>

              <div className="user-post-footer">
                <span>
                  ❤️ {likesCount}
                </span>

                <span>
                  💬 {commentsCount}
                </span>

                <span>
                  {postBudget}
                </span>
              </div>
            </div>
          </>
        );

        if (!postId) {
          return (
            <article
              key={`saved-post-${index}`}
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