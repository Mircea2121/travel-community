"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  ChevronDown,
  ChevronUp,
  Flag,
  MessageCircleReply,
  MoreVertical,
  Trash2,
} from "lucide-react";

import RepliesList from "./repliesList";
import ReplyForm from "./replyForm";

import {
  formatCommentDate,
  getAvatarUrl,
  getUserDisplayName,
  getUserInitial,
} from "../utils/postDetailsHelpers";

function getEntityId(entity) {
  return String(
    entity?._id ||
      entity?.id ||
      entity?.userId ||
      entity?.authorId ||
      entity?.author?._id ||
      entity?.user?._id ||
      ""
  );
}

export default function CommentItem({
  comment,

  replies = [],
  repliesCount = 0,
  isRepliesLoading = false,
  isRepliesExpanded = false,

  isReplyFormOpen = false,
  replyToUser = null,
  replyValue = "",
  replyError = "",
  isReplySubmitting = false,

  isAuthenticated = false,
  currentUser = null,
  postAuthorId = "",

  isCommentDeleting = false,
  deletingReplyId = "",

  onOpenReplyForm,
  onReplyToReply,
  onCloseReplyForm,
  onReplyChange,
  onReplySubmit,
  onToggleReplies,

  onDeleteComment,
  onDeleteReply,
  onReportComment,
  onReportReply,
}) {
  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  const menuWrapperRef = useRef(null);

  const commentId = String(
    comment?._id ||
      comment?.id ||
      ""
  );

  const authorName =
    getUserDisplayName(comment);

  const avatarUrl =
    getAvatarUrl(comment?.avatar);

  const username =
    typeof comment?.username ===
    "string"
      ? comment.username.trim()
      : typeof comment?.author
            ?.username === "string"
        ? comment.author.username.trim()
        : typeof comment?.user
              ?.username === "string"
          ? comment.user.username.trim()
          : "";

  const profileHref = username
    ? `/users/${username}`
    : "";

  const currentUserId =
    getEntityId(currentUser);

  const commentAuthorId = String(
    comment?.authorId ||
      comment?.userId ||
      comment?.author?._id ||
      comment?.user?._id ||
      ""
  );

  const normalizedPostAuthorId =
    String(postAuthorId || "");

  const isCommentAuthor =
    Boolean(currentUserId) &&
    currentUserId ===
      commentAuthorId;

  const isPostAuthor =
    Boolean(currentUserId) &&
    currentUserId ===
      normalizedPostAuthorId;

  const isAdmin =
    currentUser?.role === "admin";

  const canDeleteComment =
    isCommentAuthor ||
    isPostAuthor ||
    isAdmin;

  const canReportComment =
    !isCommentAuthor;

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

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        menuWrapperRef.current &&
        !menuWrapperRef.current.contains(
          event.target
        )
      ) {
        setIsMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  function handleOpenReplyForm() {
    if (
      typeof onOpenReplyForm ===
      "function"
    ) {
      onOpenReplyForm(comment);
    }
  }

  function handleReplyToReply(reply) {
    if (
      typeof onReplyToReply ===
      "function"
    ) {
      onReplyToReply(
        comment,
        reply
      );
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

  function handleToggleMenu(event) {
    event.stopPropagation();

    setIsMenuOpen(
      (currentState) =>
        !currentState
    );
  }

  function handleDeleteComment() {
    setIsMenuOpen(false);

    if (
      typeof onDeleteComment ===
      "function"
    ) {
      onDeleteComment(comment);
    }
  }

  function handleReportComment() {
    setIsMenuOpen(false);

    if (
      typeof onReportComment ===
      "function"
    ) {
      onReportComment(comment);
    }
  }

  function handleReplySubmit(event) {
    if (
      typeof onReplySubmit ===
      "function"
    ) {
      onReplySubmit(
        event,
        comment
      );
    }
  }

  const avatarContent = (
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
  );

  const authorContent = (
    <div className="comment-author">
      <strong>{authorName}</strong>
    </div>
  );

  return (
    <article
      className="comment-card"
      data-comment-id={commentId}
    >
      {profileHref ? (
        <Link
          href={profileHref}
          className="comment-avatar-link"
          aria-label={`Vezi profilul lui ${authorName}`}
        >
          {avatarContent}
        </Link>
      ) : (
        avatarContent
      )}

      <div className="comment-content">
        <div className="comment-header">
          {profileHref ? (
            <Link
              href={profileHref}
              className="comment-author-link"
            >
              {authorContent}
            </Link>
          ) : (
            authorContent
          )}

          <div className="comment-header-actions">
            <time>
              {formatCommentDate(
                comment?.createdAt
              )}
            </time>

            <div
              className="comment-menu-wrapper"
              ref={menuWrapperRef}
            >
              <button
                type="button"
                className="comment-menu-button"
                aria-label="Deschide meniul comentariului"
                aria-haspopup="menu"
                aria-expanded={
                  isMenuOpen
                }
                onClick={
                  handleToggleMenu
                }
              >
                <MoreVertical
                  size={19}
                  strokeWidth={2.2}
                />
              </button>

              {isMenuOpen && (
                <div
                  className="comment-menu"
                  role="menu"
                >
                  {canDeleteComment && (
                    <button
                      type="button"
                      className="comment-menu-option comment-menu-option-danger"
                      role="menuitem"
                      disabled={
                        isCommentDeleting
                      }
                      onClick={
                        handleDeleteComment
                      }
                    >
                      <Trash2
                        size={17}
                        strokeWidth={2.1}
                      />

                      <span>
                        {isCommentDeleting
                          ? "Se șterge..."
                          : "Șterge comentariul"}
                      </span>
                    </button>
                  )}

                  {canReportComment && (
                    <button
                      type="button"
                      className="comment-menu-option"
                      role="menuitem"
                      onClick={
                        handleReportComment
                      }
                    >
                      <Flag
                        size={17}
                        strokeWidth={2.1}
                      />

                      <span>
                        Raportează
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
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

        {isReplyFormOpen &&
          !replyToUser?.replyId && (
          <ReplyForm
            value={replyValue}
            error={replyError}
            isSubmitting={
              isReplySubmitting
            }
            replyingToName={
              authorName
            }
            replyToUser={
              replyToUser
            }
            onChange={
              onReplyChange
            }
            onSubmit={
              handleReplySubmit
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
            isAuthenticated={
              isAuthenticated
            }
            currentUser={
              currentUser
            }
            postAuthorId={
              postAuthorId
            }
            deletingReplyId={
              deletingReplyId
            }
            onReplyToReply={
              handleReplyToReply
            }
            activeReplyTargetId={
              replyToUser?.replyId || ""
            }
            isReplyFormOpen={
              isReplyFormOpen
            }
            replyToUser={
              replyToUser
            }
            replyValue={
              replyValue
            }
            replyError={
              replyError
            }
            isReplySubmitting={
              isReplySubmitting
            }
            onReplyChange={
              onReplyChange
            }
            onReplySubmit={
              handleReplySubmit
            }
            onCloseReplyForm={
              onCloseReplyForm
            }
            onDeleteReply={(
              reply
            ) => {
              if (
                typeof onDeleteReply ===
                "function"
              ) {
                onDeleteReply(
                  comment,
                  reply
                );
              }
            }}
            onReportReply={(
              reply
            ) => {
              if (
                typeof onReportReply ===
                "function"
              ) {
                onReportReply(
                  comment,
                  reply
                );
              }
            }}
          />
        )}
      </div>
    </article>
  );
}
