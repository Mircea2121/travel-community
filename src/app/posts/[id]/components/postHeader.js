import Link from "next/link";

import {
  Edit3,
  Trash2,
} from "lucide-react";

import {
  getAvatarUrl,
  getUserDisplayName,
  getUserInitial,
} from "../utils/postDetailsHelpers";

export default function PostHeader({
  post,
  isOwner,
  isDeleting,
  onBack,
  onEdit,
  onDelete,
}) {
  const authorName =
    getUserDisplayName({
      name: post?.name,
      username: post?.username,
    });

  const avatarUrl =
    getAvatarUrl(post?.avatar);

  const username =
    typeof post?.username === "string"
      ? post.username.trim()
      : "";

  const profileHref =
    username
      ? `/users/${username}`
      : "";

  const avatarContent = (
    <div className="post-details-avatar">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={authorName}
        />
      ) : (
        getUserInitial({
          name: post?.name,
          username: post?.username,
        })
      )}
    </div>
  );

  const authorContent = (
    <div>
      <h3>{authorName}</h3>

      <p>
        @{username || "utilizator"}
      </p>
    </div>
  );

  return (
    <>
      <div className="post-details-topbar">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          Înapoi
        </button>

        {isOwner && (
          <div className="post-owner-actions">
            <button
              type="button"
              className="post-edit-button"
              onClick={onEdit}
              disabled={isDeleting}
            >
              <Edit3
                size={17}
                strokeWidth={2.2}
              />

              Editează
            </button>

            <button
              type="button"
              className="post-delete-button"
              onClick={onDelete}
              disabled={isDeleting}
            >
              <Trash2
                size={17}
                strokeWidth={2.2}
              />

              {isDeleting
                ? "Se șterge..."
                : "Șterge"}
            </button>
          </div>
        )}
      </div>

      <div className="post-details-author">
        {profileHref ? (
          <Link
            href={profileHref}
            aria-label={`Vezi profilul lui ${authorName}`}
          >
            {avatarContent}
          </Link>
        ) : (
          avatarContent
        )}

        {profileHref ? (
          <Link
            href={profileHref}
            className="post-details-author-link"
          >
            {authorContent}
          </Link>
        ) : (
          authorContent
        )}
      </div>
    </>
  );
}