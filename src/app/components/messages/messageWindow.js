"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  MessageCircleMore,
  RefreshCw,
  UserRound,
} from "lucide-react";

import MessageBubble from "./messageBubble";
import MessageInput from "./messageInput";

const POLLING_INTERVAL = 4000;

export default function MessageWindow({
  conversation,
  currentUserId,
  onMessageSent,
}) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);
  const activeConversationIdRef = useRef(null);

  const conversationId = conversation?._id || null;
  const otherUser = conversation?.otherUser || null;

  const scrollToBottom = useCallback((behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({
      behavior,
      block: "end",
    });
  }, []);

  const loadMessages = useCallback(
    async ({ showLoader = false } = {}) => {
      if (!conversationId) {
        setMessages([]);
        setError("");
        return;
      }

      try {
        if (showLoader) {
          setIsLoading(true);
        }

        const response = await fetch(
          `/api/conversations/${conversationId}/messages`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Mesajele nu au putut fi încărcate."
          );
        }

        if (
          activeConversationIdRef.current !==
          conversationId
        ) {
          return;
        }

        setMessages(
          Array.isArray(data?.messages)
            ? data.messages
            : []
        );

        setError("");
      } catch (loadError) {
        if (
          activeConversationIdRef.current !==
          conversationId
        ) {
          return;
        }

        setError(
          loadError.message ||
            "Mesajele nu au putut fi încărcate."
        );
      } finally {
        if (
          activeConversationIdRef.current ===
          conversationId
        ) {
          setIsLoading(false);
        }
      }
    },
    [conversationId]
  );

  useEffect(() => {
    activeConversationIdRef.current = conversationId;

    setMessages([]);
    setError("");

    if (!conversationId) {
      setIsLoading(false);
      return undefined;
    }

    loadMessages({
      showLoader: true,
    });

    return () => {
      activeConversationIdRef.current = null;
    };
  }, [conversationId, loadMessages]);

  useEffect(() => {
    if (!conversationId) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      loadMessages({
        showLoader: false,
      });
    }, POLLING_INTERVAL);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [conversationId, loadMessages]);

  useEffect(() => {
    if (!messages.length) {
      return;
    }

    scrollToBottom("smooth");
  }, [messages, scrollToBottom]);

  function handleLocalMessageSent(message) {
    setMessages((currentMessages) => {
      const alreadyExists = currentMessages.some(
        (currentMessage) =>
          currentMessage._id === message._id
      );

      if (alreadyExists) {
        return currentMessages;
      }

      return [...currentMessages, message];
    });

    if (typeof onMessageSent === "function") {
      onMessageSent(message);
    }

    window.setTimeout(() => {
      scrollToBottom("smooth");
    }, 50);
  }

  if (!conversation) {
    return (
      <section className="message-window is-empty">
        <div className="message-window-empty-state">
          <div className="message-window-empty-icon">
            <MessageCircleMore size={34} />
          </div>

          <h2>Alege o conversație</h2>

          <p>
            Selectează o conversație din listă pentru a
            vedea mesajele.
          </p>
        </div>
      </section>
    );
  }

  const displayName =
    otherUser?.name ||
    otherUser?.username ||
    "Utilizator";

  const username = otherUser?.username || "";
  const avatar = otherUser?.avatar || "";

  return (
    <section className="message-window">
      <header className="message-window-header">
        <div className="message-window-user">
          <div className="message-window-avatar">
            {avatar ? (
              <img
                src={avatar}
                alt={`Avatar ${displayName}`}
              />
            ) : (
              <UserRound
                size={22}
                aria-hidden="true"
              />
            )}
          </div>

          <div className="message-window-user-info">
            <h2>{displayName}</h2>

            {username ? (
              <p>@{username}</p>
            ) : (
              <p>Conversație privată</p>
            )}
          </div>
        </div>
      </header>

      <div className="message-window-content">
        {isLoading ? (
          <div className="message-window-state">
            <div className="message-window-loader" />

            <p>Se încarcă mesajele...</p>
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="message-window-state">
            <MessageCircleMore size={34} />

            <h3>Mesajele nu au putut fi încărcate</h3>

            <p>{error}</p>

            <button
              type="button"
              className="message-window-retry"
              onClick={() =>
                loadMessages({
                  showLoader: true,
                })
              }
            >
              <RefreshCw size={16} />
              Încearcă din nou
            </button>
          </div>
        ) : null}

        {!isLoading &&
        !error &&
        messages.length === 0 ? (
          <div className="message-window-state">
            <MessageCircleMore size={36} />

            <h3>Începe conversația</h3>

            <p>
              Trimite primul mesaj către {displayName}.
            </p>
          </div>
        ) : null}

        {!isLoading &&
        !error &&
        messages.length > 0 ? (
          <div className="message-window-messages">
            {messages.map((message) => (
              <MessageBubble
                key={message._id}
                message={message}
                currentUserId={currentUserId}
              />
            ))}

            <div ref={messagesEndRef} />
          </div>
        ) : null}
      </div>

      <MessageInput
        conversationId={conversationId}
        onMessageSent={handleLocalMessageSent}
        disabled={isLoading}
      />
    </section>
  );
}