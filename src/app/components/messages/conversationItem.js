"use client";

import { UserRound } from "lucide-react";

function formatConversationDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();

  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isSameDay) {
    return new Intl.DateTimeFormat("ro-RO", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) {
    return "Ieri";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export default function ConversationItem({
  conversation,
  isSelected,
  currentUserId,
  onSelect,
}) {
  const otherUser = conversation?.otherUser || {};

  const displayName =
    otherUser.name ||
    otherUser.username ||
    "Utilizator";

  const avatar = otherUser.avatar || "";

  const lastMessage = conversation.lastMessage
    ? conversation.lastMessage
    : "Conversație nouă";

  const isLastMessageMine =
    conversation.lastMessageSenderId &&
    conversation.lastMessageSenderId === currentUserId;

  const unreadCount = Number(
    conversation.unreadCount || 0
  );

  const formattedDate = formatConversationDate(
    conversation.lastMessageAt ||
      conversation.updatedAt
  );

  function handleClick() {
    onSelect(conversation._id);
  }

  return (
    <button
      type="button"
      className={`conversation-item ${
        isSelected ? "is-selected" : ""
      }`}
      onClick={handleClick}
      aria-pressed={isSelected}
    >
      <div className="conversation-item-avatar">
        {avatar ? (
          <img
            src={avatar}
            alt={`Avatar ${displayName}`}
          />
        ) : (
          <UserRound size={22} aria-hidden="true" />
        )}
      </div>

      <div className="conversation-item-main">
        <div className="conversation-item-top">
          <span className="conversation-item-name">
            {displayName}
          </span>

          {formattedDate ? (
            <span className="conversation-item-date">
              {formattedDate}
            </span>
          ) : null}
        </div>

        <div className="conversation-item-bottom">
          <p
            className={`conversation-item-preview ${
              unreadCount > 0 ? "is-unread" : ""
            }`}
          >
            {isLastMessageMine &&
            conversation.lastMessage
              ? "Tu: "
              : ""}

            {lastMessage}
          </p>

          {unreadCount > 0 ? (
            <span
              className="conversation-item-badge"
              aria-label={`${unreadCount} mesaje necitite`}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}