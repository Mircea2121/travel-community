import {
  ChevronDown,
  ChevronUp,
  MessageCircleReply,
  MoreVertical,
} from "lucide-react";

import RepliesList from "./repliesList";
import ReplyForm from "./replyForm";

import {
  formatCommentDate,
  getAvatarUrl,
  getUserDisplayName,
  getUserInitial,
} from "../utils/postDetailsHelpers";

export default function CommentItem({
  comment,

  replies = [],
  repliesCount = 0,
  isRepliesLoading = false,
  isRepliesExpanded = false,

  isReplyFormOpen = false,
  replyValue = "",
  replyError = "",
  isReplySubmitting = false,

  isAuthenticated = false,

  onOpenReplyForm,
  onCloseReplyForm,
  onReplyChange,
  onReplySubmit,
  onToggleReplies,
  onOpenMenu,
}) {
  const commentId = String(
    comment?._id ||
      comment?.id ||
      ""
  );

  const authorName =
    getUserDisplayName(comment);

  const avatarUrl =
    getAvatarUrl(comment?.avatar);

  const normalizedRepliesCount =
    Number.isFinite(
      Number(repliesCount)
    )
      ? Number(repliesCount)
      : replies.length;

  const hasReplies =
    normalizedRepliesCount > 0;

  const repliesLabel =
    normalizedRepliesCount === 1
      ? "1 răspuns"
      : `${normalizedRepliesCount} răspunsuri`;

  function handleOpenReplyForm() {
    if (
      typeof onOpenReplyForm ===
      "function"
    ) {
      onOpenReplyForm(comment);
    }
  }

  function handleToggleReplies() {
    if (
      typeof onToggleReplies ===
      "function"
    ) {
      onToggleReplies(comment);
    }
  }

  function handleOpenMenu(event) {
    event.stopPropagation();

    if (
      typeof onOpenMenu ===
      "function"
    ) {
      onOpenMenu(comment, event);
    }
  }

  return (
    <article
      className="comment-card"
      data-comment-id={commentId}
    >
      <div className="comment-avatar">
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
          className="comment-avatar-fallback"
          style={{
            display: avatarUrl
              ? "none"
              : "flex",
          }}
        >
          {getUserInitial(comment)}
        </span>
      </div>

      <div className="comment-content">
        <div className="comment-header">
          <div className="comment-author">
            <strong>
              {authorName}
            </strong>

            {comment?.username && (
              <span>
                @{comment.username}
              </span>
            )}
          </div>

          <div className="comment-header-actions">
            <time>
              {formatCommentDate(
                comment?.createdAt
              )}
            </time>

            <button
              type="button"
              className="comment-menu-button"
              aria-label="Deschide meniul comentariului"
              aria-haspopup="menu"
              onClick={handleOpenMenu}
            >
              <MoreVertical
                size={19}
                strokeWidth={2.2}
              />
            </button>
          </div>
        </div>

        <p className="comment-text">
          {comment?.content}
        </p>

        <div className="comment-actions">
          {isAuthenticated && (
            <button
              type="button"
              className="comment-reply-button"
              onClick={
                handleOpenReplyForm
              }
            >
              <MessageCircleReply
                size={16}
                strokeWidth={2.2}
              />

              Răspunde
            </button>
          )}
        </div>

        {isReplyFormOpen && (
          <ReplyForm
            value={replyValue}
            error={replyError}
            isSubmitting={
              isReplySubmitting
            }
            replyingToName={
              authorName
            }
            onChange={onReplyChange}
            onSubmit={(event) =>
              onReplySubmit(
                event,
                comment
              )
            }
            onCancel={
              onCloseReplyForm
            }
          />
        )}

        {hasReplies && (
          <button
            type="button"
            className="comment-replies-toggle"
            aria-expanded={
              isRepliesExpanded
            }
            onClick={
              handleToggleReplies
            }
          >
            <span className="comment-replies-line" />

            {isRepliesExpanded ? (
              <ChevronUp
                size={18}
                strokeWidth={2.4}
              />
            ) : (
              <ChevronDown
                size={18}
                strokeWidth={2.4}
              />
            )}

            <span>
              {isRepliesExpanded
                ? "Ascunde răspunsurile"
                : repliesLabel}
            </span>
          </button>
        )}

        {isRepliesExpanded && (
          <RepliesList
            replies={replies}
            isLoading={
              isRepliesLoading
            }
          />
        )}
      </div>
    </article>
  );
}