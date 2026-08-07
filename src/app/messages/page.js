"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import ConversationList from "@/app/components/messages/conversationList";
import MessageWindow from "@/app/components/messages/messageWindow";
import { useRealtime } from "@/app/components/messages/realtimeProvider";
import { REALTIME_EVENTS } from "@/app/utils/realtimeEvents";

import "./messages.css";

const CONVERSATION_PAGE_SIZE = 50;
const PRESENCE_REFRESH_INTERVAL_MS = 30_000;
const MOBILE_BREAKPOINT_QUERY = "(max-width: 767px)";

function getMessagePreview(message) {
  if (message?.isDeleted === true) {
    return {
      lastMessage: "Mesaj șters",
      lastMessageType: "deleted",
    };
  }

  const text =
    typeof message?.text === "string" ? message.text.trim() : "";
  const images = Array.isArray(message?.images) ? message.images : [];

  if (text && images.length > 0) {
    return {
      lastMessage: text,
      lastMessageType: "mixed",
    };
  }

  if (images.length > 0) {
    return {
      lastMessage:
        images.length === 1 ? "Imagine" : `${images.length} imagini`,
      lastMessageType: "image",
    };
  }

  return {
    lastMessage: text,
    lastMessageType: "text",
  };
}

function sortConversations(conversations) {
  return [...conversations].sort((firstConversation, secondConversation) => {
    const firstTime = new Date(
      firstConversation.lastMessageAt ||
        firstConversation.updatedAt ||
        firstConversation.createdAt ||
        0
    ).getTime();
    const secondTime = new Date(
      secondConversation.lastMessageAt ||
        secondConversation.updatedAt ||
        secondConversation.createdAt ||
        0
    ).getTime();

    return secondTime - firstTime;
  });
}

function mergeConversations(currentConversations, incomingConversations) {
  const conversationsById = new Map(
    currentConversations
      .filter((conversation) => conversation?._id)
      .map((conversation) => [conversation._id, conversation])
  );

  for (const conversation of incomingConversations) {
    if (!conversation?._id) {
      continue;
    }

    conversationsById.set(conversation._id, {
      ...conversationsById.get(conversation._id),
      ...conversation,
      otherUser: {
        ...(conversationsById.get(conversation._id)?.otherUser || {}),
        ...(conversation.otherUser || {}),
      },
    });
  }

  return sortConversations([...conversationsById.values()]);
}

function MessagesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { socket, status: realtimeStatus } = useRealtime();
  const initialConversationIdRef = useRef(
    searchParams.get("conversation") || ""
  );
  const activeConversationIdRef = useRef(null);
  const loadingMoreRef = useRef(false);

  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [typingConversationIds, setTypingConversationIds] = useState(
    () => new Set()
  );
  const [pagination, setPagination] = useState({
    hasMore: false,
    nextCursor: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    activeConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  const updateConversationInUrl = useCallback(
    (conversationId) => {
      const nextSearchParams = new URLSearchParams(searchParams.toString());

      if (conversationId) {
        nextSearchParams.set("conversation", conversationId);
      } else {
        nextSearchParams.delete("conversation");
      }

      const query = nextSearchParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const loadConversations = useCallback(
    async ({ cursor = null, mode = "initial" } = {}) => {
      if (mode === "older" && loadingMoreRef.current) {
        return;
      }

      try {
        if (mode === "initial") {
          setIsLoading(true);
          setError("");
        } else if (mode === "older") {
          loadingMoreRef.current = true;
          setIsLoadingMore(true);
          setError("");
        }

        const query = new URLSearchParams({
          limit: String(CONVERSATION_PAGE_SIZE),
        });

        if (cursor) {
          query.set("cursor", cursor);
        }

        const response = await fetch(`/api/conversations?${query}`, {
          method: "GET",
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Conversațiile nu au putut fi încărcate."
          );
        }

        const incomingConversations = Array.isArray(data?.conversations)
          ? data.conversations
          : [];

        if (mode === "initial") {
          setConversations(incomingConversations);
        } else {
          setConversations((currentConversations) =>
            mergeConversations(currentConversations, incomingConversations)
          );
        }

        if (data?.currentUserId) {
          setCurrentUserId(data.currentUserId);
        }

        if (mode !== "refresh") {
          setPagination({
            hasMore: data?.pagination?.hasMore === true,
            nextCursor: data?.pagination?.nextCursor || null,
          });
        }

        if (mode === "initial") {
          const requestedConversationId = initialConversationIdRef.current;
          const requestedConversationExists = incomingConversations.some(
            (conversation) => conversation._id === requestedConversationId
          );
          const isMobile = window.matchMedia(
            MOBILE_BREAKPOINT_QUERY
          ).matches;

          setSelectedConversationId((currentSelection) => {
            if (
              currentSelection &&
              incomingConversations.some(
                (conversation) => conversation._id === currentSelection
              )
            ) {
              return currentSelection;
            }

            if (requestedConversationExists) {
              return requestedConversationId;
            }

            return isMobile ? null : incomingConversations[0]?._id || null;
          });
        }

        setError("");
      } catch (loadError) {
        setError(
          loadError?.message || "Conversațiile nu au putut fi încărcate."
        );
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        loadingMoreRef.current = false;
      }
    },
    []
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadConversations({ mode: "initial" });
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadConversations]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadConversations({ mode: "refresh" });
    }, PRESENCE_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [loadConversations]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    function handleConversationUpdated(payload) {
      const conversationId = payload?.conversationId;

      if (!conversationId) {
        return;
      }

      setConversations((currentConversations) => {
        const currentConversation = currentConversations.find(
          (conversation) => conversation._id === conversationId
        );

        if (!currentConversation) {
          loadConversations({ mode: "refresh" });
          return currentConversations;
        }

        const previousMessageTime = new Date(
          currentConversation.lastMessageAt || 0
        ).getTime();
        const nextMessageTime = new Date(payload.lastMessageAt || 0).getTime();
        const isNewIncomingMessage =
          nextMessageTime > previousMessageTime &&
          payload.lastMessageSenderId &&
          payload.lastMessageSenderId !== currentUserId;
        const isActive =
          activeConversationIdRef.current === conversationId;

        return mergeConversations(currentConversations, [
          {
            ...currentConversation,
            ...payload,
            _id: conversationId,
            unreadCount:
              isNewIncomingMessage && !isActive
                ? Number(currentConversation.unreadCount || 0) + 1
                : isActive
                  ? 0
                  : currentConversation.unreadCount,
          },
        ]);
      });
    }

    function handlePresenceUpdated(payload) {
      if (!payload?.userId) {
        return;
      }

      setConversations((currentConversations) =>
        currentConversations.map((conversation) =>
          conversation.otherUser?._id === payload.userId
            ? {
                ...conversation,
                otherUser: {
                  ...conversation.otherUser,
                  isOnline: payload.isOnline === true,
                  lastSeenAt:
                    payload.lastSeenAt ||
                    conversation.otherUser.lastSeenAt ||
                    null,
                },
              }
            : conversation
        )
      );
    }

    socket.on(
      REALTIME_EVENTS.CONVERSATION_UPDATED,
      handleConversationUpdated
    );
    socket.on(REALTIME_EVENTS.PRESENCE_UPDATED, handlePresenceUpdated);

    return () => {
      socket.off(
        REALTIME_EVENTS.CONVERSATION_UPDATED,
        handleConversationUpdated
      );
      socket.off(REALTIME_EVENTS.PRESENCE_UPDATED, handlePresenceUpdated);
    };
  }, [currentUserId, loadConversations, socket]);

  const selectedConversation =
    conversations.find(
      (conversation) => conversation._id === selectedConversationId
    ) || null;

  function selectConversation(conversationId) {
    setSelectedConversationId(conversationId);
    setConversations((currentConversations) =>
      currentConversations.map((conversation) =>
        conversation._id === conversationId
          ? { ...conversation, unreadCount: 0 }
          : conversation
      )
    );
    updateConversationInUrl(conversationId);
  }

  function closeMobileConversation() {
    setSelectedConversationId(null);
    updateConversationInUrl(null);
  }

  function updateConversationFromMessage(message, { incrementUnread = false } = {}) {
    if (!message?.conversationId) {
      return;
    }

    const preview = getMessagePreview(message);

    setConversations((currentConversations) =>
      mergeConversations(
        currentConversations,
        currentConversations
          .filter(
            (conversation) => conversation._id === message.conversationId
          )
          .map((conversation) => ({
            ...conversation,
            ...preview,
            lastMessageSenderId: message.senderId || null,
            lastMessageAt: message.createdAt || new Date().toISOString(),
            updatedAt: message.updatedAt || new Date().toISOString(),
            unreadCount: incrementUnread
              ? Number(conversation.unreadCount || 0) + 1
              : 0,
          }))
      )
    );
  }

  function handleConversationRead(conversationId) {
    setConversations((currentConversations) =>
      currentConversations.map((conversation) =>
        conversation._id === conversationId
          ? { ...conversation, unreadCount: 0 }
          : conversation
      )
    );
  }

  function handleTypingChange(conversationId, isTyping) {
    setTypingConversationIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (isTyping) {
        nextIds.add(conversationId);
      } else {
        nextIds.delete(conversationId);
      }

      return nextIds;
    });
  }

  function handlePresenceChange(payload) {
    if (!payload?.userId) {
      return;
    }

    setConversations((currentConversations) =>
      currentConversations.map((conversation) =>
        conversation.otherUser?._id === payload.userId
          ? {
              ...conversation,
              otherUser: {
                ...conversation.otherUser,
                isOnline: payload.isOnline === true,
                lastSeenAt:
                  payload.lastSeenAt ||
                  conversation.otherUser.lastSeenAt ||
                  null,
              },
            }
          : conversation
      )
    );
  }

  function handleConversationDeleted(conversationId) {
    const remainingConversations = conversations.filter(
      (conversation) => conversation._id !== conversationId
    );
    const isMobile = window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches;
    const nextConversationId = isMobile
      ? null
      : remainingConversations[0]?._id || null;

    setConversations(remainingConversations);
    setSelectedConversationId(nextConversationId);
    setTypingConversationIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.delete(conversationId);
      return nextIds;
    });
    updateConversationInUrl(nextConversationId);
  }

  return (
    <main
      className={`messages-page${
        selectedConversationId ? " has-active-conversation" : ""
      }`}
    >
      <section className="messages-shell">
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          currentUserId={currentUserId}
          typingConversationIds={typingConversationIds}
          realtimeStatus={realtimeStatus}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={pagination.hasMore}
          error={error}
          onSelectConversation={selectConversation}
          onRetry={() => loadConversations({ mode: "initial" })}
          onLoadMore={() =>
            loadConversations({
              cursor: pagination.nextCursor,
              mode: "older",
            })
          }
        />

        <MessageWindow
          conversation={selectedConversation}
          currentUserId={currentUserId}
          onBack={closeMobileConversation}
          onMessageSent={(message) => updateConversationFromMessage(message)}
          onMessageReceived={(message) =>
            updateConversationFromMessage(message, {
              incrementUnread: false,
            })
          }
          onConversationRead={handleConversationRead}
          onConversationDeleted={handleConversationDeleted}
          onTypingChange={handleTypingChange}
          onPresenceChange={handlePresenceChange}
        />
      </section>
    </main>
  );
}

function MessagesPageFallback() {
  return (
    <main className="messages-page">
      <section className="messages-shell is-loading" aria-busy="true">
        <div className="messages-page-loader" />
        <p>Se încarcă mesajele...</p>
      </section>
    </main>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<MessagesPageFallback />}>
      <MessagesPageContent />
    </Suspense>
  );
}
