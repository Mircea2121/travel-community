"use client";

import { useEffect, useRef } from "react";
import {
  LoaderCircle,
  MessageCircleMore,
  RefreshCw,
  WifiOff,
} from "lucide-react";

import ConversationItem from "./conversationItem";

const SKELETON_ITEMS = 7;

function ConversationListSkeleton() {
  return (
    <div
      className="conversation-list-skeleton"
      aria-label="Se încarcă conversațiile"
      aria-busy="true"
    >
      {Array.from({ length: SKELETON_ITEMS }, (_, index) => (
        <div className="conversation-item-skeleton" key={index} aria-hidden="true">
          <span className="conversation-item-skeleton-avatar" />
          <span className="conversation-item-skeleton-content">
            <span className="conversation-item-skeleton-line is-title" />
            <span className="conversation-item-skeleton-line is-preview" />
          </span>
        </div>
      ))}
    </div>
  );
}

function hasTypingConversation(typingConversationIds, conversationId) {
  if (!conversationId || !typingConversationIds) {
    return false;
  }

  if (typingConversationIds instanceof Set) {
    return typingConversationIds.has(conversationId);
  }

  return Array.isArray(typingConversationIds)
    ? typingConversationIds.includes(conversationId)
    : false;
}

export default function ConversationList({
  conversations = [],
  selectedConversationId = null,
  currentUserId = "",
  typingConversationIds = [],
  realtimeStatus = "idle",
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  error = "",
  onSelectConversation,
  onRetry,
  onLoadMore,
}) {
  const loadMoreRef = useRef(null);
  const safeConversations = Array.isArray(conversations)
    ? conversations
    : [];
  const hasRealtimeProblem =
    realtimeStatus === "unavailable" || realtimeStatus === "reconnecting";

  useEffect(() => {
    const target = loadMoreRef.current;

    if (
      !target ||
      !hasMore ||
      isLoading ||
      isLoadingMore ||
      typeof onLoadMore !== "function" ||
      typeof IntersectionObserver === "undefined"
    ) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      {
        root: target.closest(".conversation-list-content"),
        rootMargin: "160px 0px",
        threshold: 0,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, isLoadingMore, onLoadMore]);

  return (
    <aside className="conversation-list" aria-label="Lista conversațiilor">
      <header className="conversation-list-header">
        <div>
          <p className="conversation-list-eyebrow">
            Comunitatea Călătorilor
          </p>
          <h1 className="conversation-list-title">Mesaje</h1>
        </div>

        <div className="conversation-list-header-actions">
          {hasRealtimeProblem ? (
            <span
              className="conversation-list-connection-warning"
              title={
                realtimeStatus === "reconnecting"
                  ? "Se restabilește conexiunea în timp real"
                  : "Actualizarea în timp real nu este disponibilă"
              }
            >
              <WifiOff size={17} aria-hidden="true" />
              <span className="visually-hidden">
                Conexiunea în timp real este indisponibilă
              </span>
            </span>
          ) : null}

          <span className="conversation-list-icon" aria-hidden="true">
            <MessageCircleMore size={22} />
          </span>
        </div>
      </header>

      <div className="conversation-list-content">
        {isLoading ? <ConversationListSkeleton /> : null}

        {!isLoading && error && safeConversations.length === 0 ? (
          <div className="conversation-list-state" role="alert">
            <span className="conversation-list-state-icon is-error">
              <MessageCircleMore size={34} aria-hidden="true" />
            </span>
            <h2>Conversațiile nu au putut fi încărcate</h2>
            <p>{error}</p>
            <button
              type="button"
              className="conversation-list-retry"
              onClick={onRetry}
            >
              <RefreshCw size={16} aria-hidden="true" />
              <span>Încearcă din nou</span>
            </button>
          </div>
        ) : null}

        {!isLoading && !error && safeConversations.length === 0 ? (
          <div className="conversation-list-state">
            <span className="conversation-list-state-icon">
              <MessageCircleMore size={38} aria-hidden="true" />
            </span>
            <h2>Nicio conversație</h2>
            <p>
              Intră pe profilul unui călător și apasă butonul „Mesaj” pentru
              a începe o conversație.
            </p>
          </div>
        ) : null}

        {!isLoading && safeConversations.length > 0 ? (
          <div className="conversation-list-items">
            {safeConversations.map((conversation) => (
              <ConversationItem
                key={conversation._id}
                conversation={conversation}
                isSelected={conversation._id === selectedConversationId}
                currentUserId={currentUserId}
                isTyping={hasTypingConversation(
                  typingConversationIds,
                  conversation._id
                )}
                onSelect={onSelectConversation}
              />
            ))}

            {error ? (
              <div className="conversation-list-inline-error" role="alert">
                <span>{error}</span>
                <button type="button" onClick={onLoadMore || onRetry}>
                  Reîncearcă
                </button>
              </div>
            ) : null}

            <div
              ref={loadMoreRef}
              className="conversation-list-load-more"
              aria-live="polite"
            >
              {isLoadingMore ? (
                <span className="conversation-list-loading-more">
                  <LoaderCircle size={18} aria-hidden="true" />
                  <span>Se încarcă...</span>
                </span>
              ) : null}

              {hasMore && !isLoadingMore ? (
                <button type="button" onClick={onLoadMore}>
                  Încarcă mai multe conversații
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
