"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  Flag,
  MessageCircleReply,
  MoreVertical,
  Trash2,
} from "lucide-react";

import {
  getAvatarUrl,
  getUserDisplayName,
  getUserInitial,
  formatCommentDate,
} from "../utils/postDetailsHelpers";

import ReplyForm from "./replyForm";

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

function ReplyItem({
  reply,
  isAuthenticated,
  currentUser,
  postAuthorId,
  deletingReplyId,
  onReplyToReply,
  onDeleteReply,
  onReportReply,
}) {
  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  const menuWrapperRef = useRef(null);

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
      : typeof reply?.author
            ?.username === "string"
        ? reply.author.username.trim()
        : typeof reply?.user
              ?.username === "string"
          ? reply.user.username.trim()
          : "";

  const profileHref = username
    ? `/users/${username}`
    : "";

  const replyToUsername =
    typeof reply?.replyToUsername ===
    "string"
      ? reply.replyToUsername.trim()
      : "";

  const currentUserId =
    getEntityId(currentUser);

  const replyAuthorId = String(
    reply?.authorId ||
      reply?.userId ||
      reply?.author?._id ||
      reply?.user?._id ||
      ""
  );

  const normalizedPostAuthorId =
    String(postAuthorId || "");

  const isReplyAuthor =
    Boolean(currentUserId) &&
    currentUserId ===
      replyAuthorId;

  const isPostAuthor =
    Boolean(currentUserId) &&
    currentUserId ===
      normalizedPostAuthorId;

  const isAdmin =
    currentUser?.role === "admin";

  const canDeleteReply =
    isReplyAuthor ||
    isPostAuthor ||
    isAdmin;

  const canReportReply =
    !isReplyAuthor;

  const isReplyDeleting =
    deletingReplyId === replyId;

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

  function handleToggleMenu(event) {
    event.stopPropagation();

    setIsMenuOpen(
      (currentState) =>
        !currentState
    );
  }

  function handleReplyClick() {
    if (
      typeof onReplyToReply ===
      "function"
    ) {
      onReplyToReply(reply);
    }
  }

  function handleDeleteClick() {
    setIsMenuOpen(false);

    if (
      typeof onDeleteReply ===
      "function"
    ) {
      onDeleteReply(reply);
    }
  }

  function handleReportClick() {
    setIsMenuOpen(false);

    if (
      typeof onReportReply ===
      "function"
    ) {
      onReportReply(reply);
    }
  }

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
      <strong>{authorName}</strong>
    </div>
  );

  return (
    <article
      className="reply-card"
      data-reply-id={replyId}
    >
      {profileHref ? (
        <Link
          href={profileHref}
          className="reply-avatar-link"
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

          <div className="reply-header-actions">
            <time>
              {formatCommentDate(
                reply?.createdAt
              )}
            </time>

            <div
              className="reply-menu-wrapper"
              ref={menuWrapperRef}
            >
              <button
                type="button"
                className="reply-menu-button"
                aria-label="Deschide meniul răspunsului"
                aria-haspopup="menu"
                aria-expanded={
                  isMenuOpen
                }
                onClick={
                  handleToggleMenu
                }
              >
                <MoreVertical
                  size={18}
                  strokeWidth={2.2}
                />
              </button>

              {isMenuOpen && (
                <div
                  className="reply-menu"
                  role="menu"
                >
                  {canDeleteReply && (
                    <button
                      type="button"
                      className="reply-menu-option reply-menu-option-danger"
                      role="menuitem"
                      disabled={
                        isReplyDeleting
                      }
                      onClick={
                        handleDeleteClick
                      }
                    >
                      <Trash2
                        size={16}
                        strokeWidth={2.1}
                      />

                      <span>
                        {isReplyDeleting
                          ? "Se șterge..."
                          : "Șterge răspunsul"}
                      </span>
                    </button>
                  )}

                  {canReportReply && (
                    <button
                      type="button"
                      className="reply-menu-option"
                      role="menuitem"
                      onClick={
                        handleReportClick
                      }
                    >
                      <Flag
                        size={16}
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
              onClick={
                handleReplyClick
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
}

export default function RepliesList({
  replies = [],
  isLoading = false,
  isAuthenticated = false,
  currentUser = null,
  postAuthorId = "",
  deletingReplyId = "",
  onReplyToReply,
  onDeleteReply,
  onReportReply,
  activeReplyTargetId = "",
  isReplyFormOpen = false,
  replyToUser = null,
  replyValue = "",
  replyError = "",
  isReplySubmitting = false,
  onReplyChange,
  onReplySubmit,
  onCloseReplyForm,
}) {
  if (isLoading) {
    return (
      <p className="replies-loading">
        Se încarcă răspunsurile.
      </p>
    );
  }

  if (
    !Array.isArray(replies) ||
    replies.length === 0
  ) {
    return null;
  }

  const repliesById = new Map();
  const childrenByParentId = new Map();
  const rootReplies = [];

  replies.forEach((reply) => {
    const replyId = String(
      reply?._id ||
        reply?.id ||
        ""
    );

    if (replyId) {
      repliesById.set(replyId, reply);
    }
  });

  replies.forEach((reply) => {
    const replyId = String(
      reply?._id ||
        reply?.id ||
        ""
    );

    if (!replyId) {
      return;
    }

    const parentReplyId = String(
      reply?.parentReplyId || ""
    );

    if (
      parentReplyId &&
      repliesById.has(parentReplyId)
    ) {
      const siblings =
        childrenByParentId.get(
          parentReplyId
        ) || [];

      siblings.push(reply);
      childrenByParentId.set(
        parentReplyId,
        siblings
      );
    } else {
      rootReplies.push(reply);
    }
  });

  function renderReplyBranch(
    reply,
    depth = 0
  ) {
    const replyId = String(
      reply?._id ||
        reply?.id ||
        ""
    );

    if (!replyId) {
      return null;
    }

    const childReplies =
      childrenByParentId.get(
        replyId
      ) || [];

    const isTarget =
      isReplyFormOpen &&
      activeReplyTargetId ===
        replyId;

    return (
      <div
        key={replyId}
        className="reply-thread-branch"
        style={{
          "--reply-depth":
            Math.min(depth, 3),
        }}
      >
        <ReplyItem
          reply={reply}
          isAuthenticated={
            isAuthenticated
          }
          currentUser={currentUser}
          postAuthorId={
            postAuthorId
          }
          deletingReplyId={
            deletingReplyId
          }
          onReplyToReply={
            onReplyToReply
          }
          onDeleteReply={
            onDeleteReply
          }
          onReportReply={
            onReportReply
          }
        />

        {isTarget && (
          <div className="reply-inline-form">
            <ReplyForm
              value={replyValue}
              error={replyError}
              isSubmitting={
                isReplySubmitting
              }
              replyingToName={
                getUserDisplayName(
                  reply
                )
              }
              replyToUser={
                replyToUser
              }
              onChange={
                onReplyChange
              }
              onSubmit={
                onReplySubmit
              }
              onCancel={
                onCloseReplyForm
              }
            />
          </div>
        )}

        {childReplies.length > 0 && (
          <div className="reply-thread-children">
            {childReplies.map(
              (childReply) =>
                renderReplyBranch(
                  childReply,
                  depth + 1
                )
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="replies-list">
      {rootReplies.map((reply) =>
        renderReplyBranch(reply)
      )}
    </div>
  );
}
