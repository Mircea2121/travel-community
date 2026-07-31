"use client";

import { MessageCircleMore, RefreshCw } from "lucide-react";

import ConversationItem from "./conversationItem";

export default function ConversationList({
  conversations,
  selectedConversationId,
  currentUserId,
  isLoading,
  error,
  onSelectConversation,
  onRetry,
}) {
  return (
    <aside className="conversation-list">
      <div className="conversation-list-header">
        <div>
          <p className="conversation-list-eyebrow">
            Comunitatea Călătorilor
          </p>

          <h1 className="conversation-list-title">
            Mesaje
          </h1>
        </div>

        <div
          className="conversation-list-icon"
          aria-hidden="true"
        >
          <MessageCircleMore size={22} />
        </div>
      </div>

      <div className="conversation-list-content">
        {isLoading ? (
          <div className="conversation-list-state">
            <div className="conversation-list-loader" />

            <p>Se încarcă conversațiile...</p>
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="conversation-list-state">
            <MessageCircleMore size={34} />

            <h2>Conversațiile nu au putut fi încărcate</h2>

            <p>{error}</p>

            <button
              type="button"
              className="conversation-list-retry"
              onClick={onRetry}
            >
              <RefreshCw size={16} />
              Încearcă din nou
            </button>
          </div>
        ) : null}

        {!isLoading &&
        !error &&
        conversations.length === 0 ? (
          <div className="conversation-list-state">
            <MessageCircleMore size={38} />

            <h2>Nicio conversație</h2>

            <p>
              Intră pe profilul unui călător și apasă
              butonul „Mesaj” pentru a începe o
              conversație.
            </p>
          </div>
        ) : null}

        {!isLoading &&
        !error &&
        conversations.length > 0 ? (
          <div className="conversation-list-items">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation._id}
                conversation={conversation}
                isSelected={
                  conversation._id ===
                  selectedConversationId
                }
                currentUserId={currentUserId}
                onSelect={onSelectConversation}
              />
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  );
}