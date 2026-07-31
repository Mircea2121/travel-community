"use client";

function formatMessageTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function MessageBubble({
  message,
  currentUserId,
}) {
  const isMine =
    message?.senderId === currentUserId;

  const formattedTime = formatMessageTime(
    message?.createdAt
  );

  return (
    <div
      className={`message-row ${
        isMine ? "is-mine" : "is-other"
      }`}
    >
      <div
        className={`message-bubble ${
          isMine ? "is-mine" : "is-other"
        }`}
      >
        <p className="message-bubble-text">
          {message?.text || ""}
        </p>

        <div className="message-bubble-meta">
          {formattedTime ? (
            <span className="message-bubble-time">
              {formattedTime}
            </span>
          ) : null}

          {isMine ? (
            <span
              className="message-bubble-status"
              aria-label={
                message?.isRead
                  ? "Mesaj citit"
                  : "Mesaj trimis"
              }
            >
              {message?.isRead ? "Citit" : "Trimis"}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}