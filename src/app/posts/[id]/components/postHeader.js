import Link from "next/link";

import {
  ChevronLeft,
  Pencil,
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

  const profileHref = username
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
          className="post-topbar-icon-button post-back-icon-button"
          onClick={onBack}
          aria-label="Înapoi"
          title="Înapoi"
        >
          <ChevronLeft
            size={23}
            strokeWidth={2.4}
          />
        </button>

        {isOwner && (
          <div className="post-owner-actions">
            <button
              type="button"
              className="post-topbar-icon-button post-edit-icon-button"
              onClick={onEdit}
              disabled={isDeleting}
              aria-label="Editează postarea"
              title="Editează"
            >
              <Pencil
                size={19}
                strokeWidth={2.2}
              />
            </button>

            <button
              type="button"
              className="post-topbar-icon-button post-delete-icon-button"
              onClick={onDelete}
              disabled={isDeleting}
              aria-label={
                isDeleting
                  ? "Se șterge postarea"
                  : "Șterge postarea"
              }
              title={
                isDeleting
                  ? "Se șterge..."
                  : "Șterge"
              }
            >
              <Trash2
                size={19}
                strokeWidth={2.2}
              />
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