import Link from "next/link";

import {
  MessageCircleReply,
} from "lucide-react";

import {
  getAvatarUrl,
  getUserDisplayName,
  getUserInitial,
  formatCommentDate,
} from "../utils/postDetailsHelpers";

export default function RepliesList({
  replies = [],
  isLoading = false,
  isAuthenticated = false,
  onReplyToReply,
}) {
  if (isLoading) {
    return (
      <p className="replies-loading">
        Se încarcă răspunsurile...
      </p>
    );
  }

  if (
    !Array.isArray(replies) ||
    replies.length === 0
  ) {
    return null;
  }

  function handleReplyToReply(reply) {
    if (
      typeof onReplyToReply ===
      "function"
    ) {
      onReplyToReply(reply);
    }
  }

  return (
    <div className="replies-list">
      {replies.map((reply) => {
        const replyId = String(
          reply?._id ||
            reply?.id ||
            ""
        );

        const authorName =
          getUserDisplayName(reply);

        const avatarUrl =
          getAvatarUrl(reply?.avatar);

        const username =
          typeof reply?.username ===
          "string"
            ? reply.username.trim()
            : "";

        const profileHref =
          username
            ? `/users/${username}`
            : "";

        const replyToUsername =
          typeof reply?.replyToUsername ===
          "string"
            ? reply.replyToUsername.trim()
            : "";

        const avatarContent = (
          <div className="reply-avatar">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={authorName}
                onError={(event) => {
                  event.currentTarget.style.display =
                    "none";

                  const fallback =
                    event.currentTarget
                      .nextElementSibling;

                  if (fallback) {
                    fallback.style.display =
                      "flex";
                  }
                }}
              />
            ) : null}

            <span
              className="reply-avatar-fallback"
              style={{
                display: avatarUrl
                  ? "none"
                  : "flex",
              }}
            >
              {getUserInitial(reply)}
            </span>
          </div>
        );

        const authorContent = (
          <div>
            <strong>
              {authorName}
            </strong>

            {username && (
              <span>
                @{username}
              </span>
            )}
          </div>
        );

        return (
          <article
            key={replyId}
            className="reply-card"
            data-reply-id={replyId}
          >
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

            <div className="reply-content">
              <div className="reply-header">
                {profileHref ? (
                  <Link
                    href={profileHref}
                    className="reply-author-link"
                  >
                    {authorContent}
                  </Link>
                ) : (
                  authorContent
                )}

                <time>
                  {formatCommentDate(
                    reply?.createdAt
                  )}
                </time>
              </div>

              <p className="reply-text">
                {replyToUsername && (
                  <>
                    <Link
                      href={`/users/${replyToUsername}`}
                      className="reply-mention"
                    >
                      @{replyToUsername}
                    </Link>{" "}
                  </>
                )}

                {reply?.content}
              </p>

              {isAuthenticated && (
                <div className="reply-actions">
                  <button
                    type="button"
                    className="reply-to-reply-button"
                    onClick={() =>
                      handleReplyToReply(
                        reply
                      )
                    }
                  >
                    <MessageCircleReply
                      size={15}
                      strokeWidth={2.2}
                    />

                    Răspunde
                  </button>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}