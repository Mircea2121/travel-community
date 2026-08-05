"use client";

import { memo } from "react";
import {
  Image as ImageIcon,
  Images,
  Trash2,
  UserRound,
} from "lucide-react";

function isSameCalendarDay(firstDate, secondDate) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function formatConversationDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();

  if (isSameCalendarDay(date, now)) {
    return new Intl.DateTimeFormat("ro-RO", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameCalendarDay(date, yesterday)) {
    return "Ieri";
  }

  if (date.getFullYear() === now.getFullYear()) {
    return new Intl.DateTimeFormat("ro-RO", {
      day: "2-digit",
      month: "short",
    }).format(date);
  }

  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getAvatarUrl(user) {
  if (typeof user?.avatar === "string") {
    return user.avatar.trim();
  }

  if (typeof user?.avatar?.url === "string") {
    return user.avatar.url.trim();
  }

  return typeof user?.avatarData?.url === "string"
    ? user.avatarData.url.trim()
    : "";
}

function getMessagePreview(conversation) {
  const lastMessage =
    typeof conversation?.lastMessage === "string"
      ? conversation.lastMessage.trim()
      : "";
  const messageType = conversation?.lastMessageType || "text";

  if (messageType === "deleted") {
    return {
      text: "Mesaj șters",
      Icon: Trash2,
    };
  }

  if (messageType === "image") {
    const hasMultipleImages = /^\d+\s+imagini$/i.test(lastMessage);

    return {
      text: lastMessage || "Imagine",
      Icon: hasMultipleImages ? Images : ImageIcon,
    };
  }

  if (messageType === "mixed") {
    return {
      text: lastMessage || "Mesaj cu imagini",
      Icon: ImageIcon,
    };
  }

  return {
    text: lastMessage || "Conversație nouă",
    Icon: null,
  };
}

function ConversationItem({
  conversation,
  isSelected = false,
  currentUserId = "",
  isTyping = false,
  onSelect,
}) {
  const conversationId = conversation?._id || "";
  const otherUser = conversation?.otherUser || {};
  const displayName =
    otherUser.name ||
    otherUser.fullName ||
    otherUser.username ||
    "Utilizator";
  const avatarUrl = getAvatarUrl(otherUser);
  const isOnline = otherUser.isOnline === true;
  const unreadCount = Math.max(
    0,
    Number.isFinite(Number(conversation?.unreadCount))
      ? Math.trunc(Number(conversation.unreadCount))
      : 0
  );
  const isLastMessageMine =
    Boolean(conversation?.lastMessageSenderId) &&
    String(conversation.lastMessageSenderId) === String(currentUserId);
  const formattedDate = formatConversationDate(
    conversation?.lastMessageAt ||
      conversation?.updatedAt ||
      conversation?.createdAt
  );
  const preview = getMessagePreview(conversation);
  const PreviewIcon = preview.Icon;
  const accessibleStatus = isTyping
    ? `${displayName} scrie`
    : unreadCount > 0
      ? `${unreadCount} ${
          unreadCount === 1 ? "mesaj necitit" : "mesaje necitite"
        }`
      : "";

  function handleSelect() {
    if (conversationId) {
      onSelect?.(conversationId);
    }
  }

  return (
    <button
      type="button"
      className={`conversation-item${
        isSelected ? " is-selected" : ""
      }${unreadCount > 0 ? " has-unread" : ""}`}
      onClick={handleSelect}
      aria-current={isSelected ? "true" : undefined}
      aria-label={`${displayName}${
        accessibleStatus ? `, ${accessibleStatus}` : ""
      }`}
    >
      <span className="conversation-item-avatar-wrapper">
        <span className="conversation-item-avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" loading="lazy" />
          ) : (
            <UserRound size={22} aria-hidden="true" />
          )}
        </span>

        <span
          className={`conversation-item-presence-dot${
            isOnline ? " is-online" : ""
          }`}
          title={isOnline ? "Online" : "Offline"}
          aria-hidden="true"
        />
      </span>

      <span className="conversation-item-main">
        <span className="conversation-item-top">
          <span className="conversation-item-name">{displayName}</span>

          {formattedDate ? (
            <time
              className="conversation-item-date"
              dateTime={
                conversation?.lastMessageAt ||
                conversation?.updatedAt ||
                conversation?.createdAt
              }
            >
              {formattedDate}
            </time>
          ) : null}
        </span>

        <span className="conversation-item-bottom">
          <span
            className={`conversation-item-preview${
              unreadCount > 0 ? " is-unread" : ""
            }${isTyping ? " is-typing" : ""}`}
          >
            {isTyping ? (
              <>
                <span className="conversation-item-typing-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span>Scrie...</span>
              </>
            ) : (
              <>
                {PreviewIcon ? (
                  <PreviewIcon size={14} aria-hidden="true" />
                ) : null}
                <span className="conversation-item-preview-text">
                  {isLastMessageMine && conversation?.lastMessage
                    ? "Tu: "
                    : ""}
                  {preview.text}
                </span>
              </>
            )}
          </span>

          {unreadCount > 0 ? (
            <span className="conversation-item-badge" aria-hidden="true">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

export default memo(ConversationItem);
