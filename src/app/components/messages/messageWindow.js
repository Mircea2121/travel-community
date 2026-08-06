"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowDown,
  LoaderCircle,
  MessageCircleMore,
  RefreshCw,
} from "lucide-react";

import {
  REALTIME_EVENTS,
  REALTIME_LIMITS,
} from "@/app/utils/realtimeEvents";

import ChatHeader from "./chatHeader";
import DeleteConversationDialog from "./deleteConversationDialog";
import MessageBubble from "./messageBubble";
import MessageImageViewer from "./messageImageViewer";
import MessageInput from "./messageInput";
import ReportDialog from "./reportDialog";
import { useRealtime } from "./realtimeProvider";

const MESSAGE_PAGE_SIZE = 50;
const FALLBACK_POLL_INTERVAL_MS = 5_000;
const NEAR_BOTTOM_THRESHOLD_PX = 160;

function mergeMessages(currentMessages, incomingMessages) {
  const messagesById = new Map();

  for (const message of currentMessages) {
    if (message?._id) {
      messagesById.set(message._id, message);
    }
  }

  for (const message of incomingMessages) {
    if (message?._id) {
      messagesById.set(message._id, {
        ...messagesById.get(message._id),
        ...message,
      });
    }
  }

  return [...messagesById.values()].sort((firstMessage, secondMessage) => {
    const firstTime = new Date(firstMessage.createdAt || 0).getTime();
    const secondTime = new Date(secondMessage.createdAt || 0).getTime();

    if (firstTime !== secondTime) {
      return firstTime - secondTime;
    }

    return String(firstMessage._id).localeCompare(String(secondMessage._id));
  });
}

function isSameCalendarDay(firstValue, secondValue) {
  const firstDate = new Date(firstValue);
  const secondDate = new Date(secondValue);

  if (
    Number.isNaN(firstDate.getTime()) ||
    Number.isNaN(secondDate.getTime())
  ) {
    return false;
  }

  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function formatDateDivider(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const today = new Date();

  if (isSameCalendarDay(date, today)) {
    return "Astăzi";
  }

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSameCalendarDay(date, yesterday)) {
    return "Ieri";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  }).format(date);
}

function isMessageHiddenForUser(message, currentUserId) {
  return (
    Array.isArray(message?.deletedFor) &&
    message.deletedFor.some(
      (userId) => String(userId) === String(currentUserId)
    )
  );
}

function createMediaItem({ image, imageIndex, message }) {
  if (
    !image ||
    typeof image.url !== "string" ||
    !image.url.trim() ||
    !message?._id
  ) {
    return null;
  }

  return {
    ...image,
    id: image.publicId || `${message._id}:${imageIndex}`,
    messageId: message._id,
    imageIndex,
    senderId: message.senderId || null,
    messageCreatedAt: message.createdAt || null,
  };
}

function mergeMediaItems(currentItems, incomingItems) {
  const itemsById = new Map();

  for (const item of [...currentItems, ...incomingItems]) {
    if (item?.id && item?.url) {
      itemsById.set(item.id, {
        ...itemsById.get(item.id),
        ...item,
      });
    }
  }

  return [...itemsById.values()].sort((firstItem, secondItem) => {
    const firstTime = new Date(firstItem.messageCreatedAt || 0).getTime();
    const secondTime = new Date(secondItem.messageCreatedAt || 0).getTime();

    if (firstTime !== secondTime) {
      return firstTime - secondTime;
    }

    if (firstItem.messageId !== secondItem.messageId) {
      return String(firstItem.messageId).localeCompare(
        String(secondItem.messageId)
      );
    }

    return Number(firstItem.imageIndex || 0) - Number(secondItem.imageIndex || 0);
  });
}

export default function MessageWindow({
  conversation,
  currentUserId = "",
  onBack,
  onMessageSent,
  onMessageReceived,
  onConversationRead,
  onConversationDeleted,
  onTypingChange,
  onPresenceChange,
}) {
  const {
    socket,
    status: realtimeStatus,
    isConnected,
    emitWithAck,
    joinConversation,
    leaveConversation,
  } = useRealtime();
  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [presenceOverride, setPresenceOverride] = useState(null);
  const [pagination, setPagination] = useState({
    hasMore: false,
    nextCursor: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [olderMessagesError, setOlderMessagesError] = useState("");
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const [showNewMessagesButton, setShowNewMessagesButton] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const [deleteConversationError, setDeleteConversationError] = useState("");
  const [conversationMedia, setConversationMedia] = useState([]);
  const [activeMediaId, setActiveMediaId] = useState("");
  const [mediaPagination, setMediaPagination] = useState({
    hasOlder: false,
    hasNewer: false,
    olderCursor: null,
    newerCursor: null,
  });
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState("");

  const contentRef = useRef(null);
  const messagesEndRef = useRef(null);
  const activeConversationIdRef = useRef(null);
  const initialScrollPendingRef = useRef(false);
  const lastSeenMessageIdRef = useRef(null);
  const typingSentAtRef = useRef(0);
  const typingStopTimerRef = useRef(null);
  const mediaRequestRef = useRef(null);

  const conversationId = conversation?._id || null;
  const otherUser =
    presenceOverride?.conversationId === conversationId
      ? {
          ...(conversation?.otherUser || {}),
          ...presenceOverride.user,
        }
      : conversation?.otherUser || null;
  const otherUserId = otherUser?._id || "";

  const isNearBottom = useCallback(() => {
    const content = contentRef.current;

    if (!content) {
      return true;
    }

    return (
      content.scrollHeight - content.scrollTop - content.clientHeight <=
      NEAR_BOTTOM_THRESHOLD_PX
    );
  }, []);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    const content = contentRef.current;

    if (content) {
      content.scrollTo({
        top: content.scrollHeight,
        behavior,
      });
    } else {
      messagesEndRef.current?.scrollIntoView({
        behavior,
        block: "end",
      });
    }

    setShowNewMessagesButton(false);
  }, []);

  const markConversationSeen = useCallback(
    async (messageList) => {
      if (
        !conversationId ||
        !currentUserId ||
        document.visibilityState !== "visible" ||
        !document.hasFocus()
      ) {
        return;
      }

      const lastUnreadIncomingMessage = [...messageList]
        .reverse()
        .find(
          (message) =>
            message?.senderId !== currentUserId &&
            message?.isDeleted !== true &&
            message?.isRead !== true
        );

      if (
        !lastUnreadIncomingMessage?._id ||
        lastSeenMessageIdRef.current === lastUnreadIncomingMessage._id
      ) {
        return;
      }

      lastSeenMessageIdRef.current = lastUnreadIncomingMessage._id;

      try {
        const response = await fetch(
          `/api/conversations/${conversationId}/messages/seen`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messageId: lastUnreadIncomingMessage._id,
            }),
          }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Citirea nu a putut fi confirmată.");
        }

        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.senderId !== currentUserId
              ? { ...message, isRead: true }
              : message
          )
        );
        onConversationRead?.(conversationId, data?.seen || null);
      } catch {
        if (lastSeenMessageIdRef.current === lastUnreadIncomingMessage._id) {
          lastSeenMessageIdRef.current = null;
        }
      }
    },
    [conversationId, currentUserId, onConversationRead]
  );

  const loadMessages = useCallback(
    async ({ cursor = null, mode = "initial" } = {}) => {
      if (!conversationId) {
        return;
      }

      const isOlderRequest = mode === "older";
      const previousScrollHeight = contentRef.current?.scrollHeight || 0;
      const previousScrollTop = contentRef.current?.scrollTop || 0;

      try {
        if (mode === "initial") {
          setIsLoading(true);
          setLoadError("");
        } else if (isOlderRequest) {
          setIsLoadingOlder(true);
          setOlderMessagesError("");
        }

        const searchParams = new URLSearchParams({
          limit: String(MESSAGE_PAGE_SIZE),
        });

        if (cursor) {
          searchParams.set("cursor", cursor);
        }

        const response = await fetch(
          `/api/conversations/${conversationId}/messages?${searchParams}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Mesajele nu au putut fi încărcate.");
        }

        if (activeConversationIdRef.current !== conversationId) {
          return;
        }

        const incomingMessages = Array.isArray(data?.messages)
          ? data.messages.filter(
              (message) => !isMessageHiddenForUser(message, currentUserId)
            )
          : [];

        if (mode === "initial") {
          setMessages(incomingMessages);
          initialScrollPendingRef.current = true;
        } else {
          setMessages((currentMessages) =>
            mergeMessages(currentMessages, incomingMessages)
          );
        }

        if (mode !== "refresh") {
          setPagination({
            hasMore: data?.pagination?.hasMore === true,
            nextCursor: data?.pagination?.nextCursor || null,
          });
        }

        if (isOlderRequest) {
          window.requestAnimationFrame(() => {
            const content = contentRef.current;

            if (content) {
              content.scrollTop =
                previousScrollTop + content.scrollHeight - previousScrollHeight;
            }
          });
        }

        setLoadError("");
      } catch (error) {
        const message =
          error?.message || "Mesajele nu au putut fi încărcate.";

        if (isOlderRequest) {
          setOlderMessagesError(message);
        } else if (mode === "initial") {
          setLoadError(message);
        }
      } finally {
        if (activeConversationIdRef.current === conversationId) {
          setIsLoading(false);
          setIsLoadingOlder(false);
        }
      }
    },
    [conversationId, currentUserId]
  );

  useEffect(() => {
    activeConversationIdRef.current = conversationId;
    window.clearTimeout(typingStopTimerRef.current);
    lastSeenMessageIdRef.current = null;
    typingSentAtRef.current = 0;
    let isCancelled = false;

    queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      setMessages([]);
      setReplyTo(null);
      setPagination({ hasMore: false, nextCursor: null });
      setLoadError("");
      setOlderMessagesError("");
      setIsOtherUserTyping(false);
      setShowNewMessagesButton(false);
      setReportTarget(null);
      setIsDeleteDialogOpen(false);
      setDeleteConversationError("");
      setConversationMedia([]);
      setActiveMediaId("");
      setMediaPagination({
        hasOlder: false,
        hasNewer: false,
        olderCursor: null,
        newerCursor: null,
      });
      setIsMediaLoading(false);
      setMediaError("");

      if (!conversationId) {
        setIsLoading(false);
        return;
      }

      loadMessages({ mode: "initial" });
    });

    return () => {
      isCancelled = true;
      mediaRequestRef.current?.abort();
      activeConversationIdRef.current = null;
      window.clearTimeout(typingStopTimerRef.current);
    };
  }, [conversationId, loadMessages]);

  useEffect(() => {
    if (!initialScrollPendingRef.current || isLoading) {
      return undefined;
    }

    initialScrollPendingRef.current = false;
    const content = contentRef.current;

    if (!content) {
      return undefined;
    }

    let animationFrame = 0;
    let settleFrame = 0;
    let observerTimer = 0;
    let isCancelled = false;
    const pendingImages = new Set(
      [...content.querySelectorAll("img")].filter(
        (image) => !image.complete
      )
    );

    const resizeObserver =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(() => {
            if (!isCancelled) {
              scrollToBottom("auto");
            }
          })
        : null;

    function scrollAfterLayout() {
      window.cancelAnimationFrame(animationFrame);
      window.cancelAnimationFrame(settleFrame);

      animationFrame = window.requestAnimationFrame(() => {
        if (isCancelled) {
          return;
        }

        scrollToBottom("auto");
        settleFrame = window.requestAnimationFrame(() => {
          if (!isCancelled) {
            scrollToBottom("auto");
          }
        });
      });
    }

    function scheduleObserverDisconnect() {
      if (pendingImages.size > 0) {
        return;
      }

      window.clearTimeout(observerTimer);
      observerTimer = window.setTimeout(() => {
        resizeObserver?.disconnect();
      }, 250);
    }

    function handleImageSettled(event) {
      const image = event.currentTarget;

      image.removeEventListener("load", handleImageSettled);
      image.removeEventListener("error", handleImageSettled);
      pendingImages.delete(image);
      scrollAfterLayout();
      scheduleObserverDisconnect();
    }

    for (const image of pendingImages) {
      image.addEventListener("load", handleImageSettled);
      image.addEventListener("error", handleImageSettled);
    }

    const messagesContainer = content.querySelector(
      ".message-window-messages"
    );

    if (messagesContainer) {
      resizeObserver?.observe(messagesContainer);
    }

    scrollAfterLayout();
    scheduleObserverDisconnect();

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(animationFrame);
      window.cancelAnimationFrame(settleFrame);
      window.clearTimeout(observerTimer);
      resizeObserver?.disconnect();

      for (const image of pendingImages) {
        image.removeEventListener("load", handleImageSettled);
        image.removeEventListener("error", handleImageSettled);
      }
    };
  }, [isLoading, messages.length, scrollToBottom]);

  useEffect(() => {
    if (messages.length === 0) {
      return undefined;
    }

    const messageList = messages;
    const timeout = window.setTimeout(() => {
      markConversationSeen(messageList);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [messages, markConversationSeen]);

  useEffect(() => {
    function handleVisibilityOrFocus() {
      if (document.visibilityState === "visible") {
        markConversationSeen(messages);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
    };
  }, [markConversationSeen, messages]);

  useEffect(() => {
    if (!conversationId || isConnected) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      loadMessages({ mode: "refresh" });
    }, FALLBACK_POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [conversationId, isConnected, loadMessages]);

  useEffect(() => {
    if (!conversationId || !isConnected || !socket) {
      return undefined;
    }

    joinConversation(conversationId).catch(() => {});

    function isCurrentConversation(payload) {
      return payload?.conversationId === conversationId;
    }

    function handleMessageCreated(message) {
      if (!isCurrentConversation(message) || !message?._id) {
        return;
      }

      const shouldScroll =
        message.senderId === currentUserId || isNearBottom();

      setMessages((currentMessages) =>
        mergeMessages(currentMessages, [message])
      );

      if (message.senderId !== currentUserId) {
        onMessageReceived?.(message);
      }

      window.requestAnimationFrame(() => {
        if (shouldScroll) {
          scrollToBottom("smooth");
        } else {
          setShowNewMessagesButton(true);
        }
      });
    }

    function handleMessageUpdated(message) {
      if (!isCurrentConversation(message) || !message?._id) {
        return;
      }

      if (isMessageHiddenForUser(message, currentUserId)) {
        setMessages((currentMessages) =>
          currentMessages.filter(
            (currentMessage) => currentMessage._id !== message._id
          )
        );
        return;
      }

      setMessages((currentMessages) =>
        mergeMessages(currentMessages, [message])
      );
    }

    function handleMessageDeleted(message) {
      handleMessageUpdated(message);
    }

    function handleReactionUpdated(payload) {
      if (!isCurrentConversation(payload) || !payload?.messageId) {
        return;
      }

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message._id === payload.messageId
            ? {
                ...message,
                reactions: Array.isArray(payload.reactions)
                  ? payload.reactions
                  : [],
                updatedAt: payload.updatedAt || message.updatedAt,
              }
            : message
        )
      );
    }

    function handleSeenUpdated(payload) {
      if (!isCurrentConversation(payload) || !payload?.messageId) {
        return;
      }

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message._id === payload.messageId
            ? {
                ...message,
                isRead: payload.isRead === true,
                seenBy: Array.isArray(payload.seenBy)
                  ? payload.seenBy
                  : message.seenBy,
              }
            : message
        )
      );
    }

    function handleTypingUpdated(payload) {
      if (
        !isCurrentConversation(payload) ||
        payload?.userId === currentUserId
      ) {
        return;
      }

      const nextIsTyping = payload?.isTyping === true;
      setIsOtherUserTyping(nextIsTyping);
      onTypingChange?.(conversationId, nextIsTyping);

      window.clearTimeout(typingStopTimerRef.current);

      if (nextIsTyping) {
        const expiresAt = new Date(payload?.expiresAt || 0).getTime();
        const delay = Number.isFinite(expiresAt)
          ? Math.max(expiresAt - Date.now(), 0)
          : REALTIME_LIMITS.TYPING_TTL_SECONDS * 1_000;

        typingStopTimerRef.current = window.setTimeout(() => {
          setIsOtherUserTyping(false);
          onTypingChange?.(conversationId, false);
        }, delay + 100);
      }
    }

    function handlePresenceUpdated(payload) {
      if (!payload?.userId || payload.userId !== otherUserId) {
        return;
      }

      setPresenceOverride({
        conversationId,
        user: {
          isOnline: payload.isOnline === true,
          lastSeenAt: payload.lastSeenAt || null,
        },
      });
      onPresenceChange?.(payload);
    }

    socket.on(REALTIME_EVENTS.MESSAGE_CREATED, handleMessageCreated);
    socket.on(REALTIME_EVENTS.MESSAGE_UPDATED, handleMessageUpdated);
    socket.on(REALTIME_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
    socket.on(REALTIME_EVENTS.REACTION_UPDATED, handleReactionUpdated);
    socket.on(REALTIME_EVENTS.SEEN_UPDATED, handleSeenUpdated);
    socket.on(REALTIME_EVENTS.TYPING_UPDATED, handleTypingUpdated);
    socket.on(REALTIME_EVENTS.PRESENCE_UPDATED, handlePresenceUpdated);

    return () => {
      socket.off(REALTIME_EVENTS.MESSAGE_CREATED, handleMessageCreated);
      socket.off(REALTIME_EVENTS.MESSAGE_UPDATED, handleMessageUpdated);
      socket.off(REALTIME_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
      socket.off(REALTIME_EVENTS.REACTION_UPDATED, handleReactionUpdated);
      socket.off(REALTIME_EVENTS.SEEN_UPDATED, handleSeenUpdated);
      socket.off(REALTIME_EVENTS.TYPING_UPDATED, handleTypingUpdated);
      socket.off(REALTIME_EVENTS.PRESENCE_UPDATED, handlePresenceUpdated);
      window.clearTimeout(typingStopTimerRef.current);

      leaveConversation(conversationId).catch(() => {});
    };
  }, [
    conversationId,
    currentUserId,
    isConnected,
    isNearBottom,
    joinConversation,
    leaveConversation,
    onMessageReceived,
    onPresenceChange,
    onTypingChange,
    otherUserId,
    scrollToBottom,
    socket,
  ]);

  const handleTypingStart = useCallback(() => {
    if (!conversationId || !isConnected) {
      return;
    }

    const now = Date.now();

    if (
      now - typingSentAtRef.current <
      REALTIME_LIMITS.TYPING_REFRESH_INTERVAL_MS
    ) {
      return;
    }

    typingSentAtRef.current = now;
    emitWithAck(REALTIME_EVENTS.TYPING_START, { conversationId }).catch(
      () => {}
    );
  }, [conversationId, emitWithAck, isConnected]);

  const handleTypingStop = useCallback(() => {
    if (!conversationId || !isConnected || typingSentAtRef.current === 0) {
      return;
    }

    typingSentAtRef.current = 0;
    emitWithAck(REALTIME_EVENTS.TYPING_STOP, { conversationId }).catch(
      () => {}
    );
  }, [conversationId, emitWithAck, isConnected]);

  function handleMessageSent(message) {
    setMessages((currentMessages) => mergeMessages(currentMessages, [message]));
    setReplyTo(null);
    onMessageSent?.(message);
    window.requestAnimationFrame(() => scrollToBottom("smooth"));
  }

  function handleMessageUpdated(message) {
    if (!message?._id) {
      return;
    }

    setMessages((currentMessages) => mergeMessages(currentMessages, [message]));

    if (
      message.isDeleted === true ||
      isMessageHiddenForUser(message, currentUserId)
    ) {
      setConversationMedia((currentItems) => {
        const removedIds = new Set(
          currentItems
            .filter((item) => item.messageId === message._id)
            .map((item) => item.id)
        );

        if (removedIds.has(activeMediaId)) {
          setActiveMediaId("");
        }

        return currentItems.filter(
          (item) => item.messageId !== message._id
        );
      });
    }
  }

  function handleMessageRemoved(messageId) {
    setMessages((currentMessages) =>
      currentMessages.filter((message) => message._id !== messageId)
    );

    if (replyTo?._id === messageId) {
      setReplyTo(null);
    }

    setConversationMedia((currentItems) => {
      const removedIds = new Set(
        currentItems
          .filter((item) => item.messageId === messageId)
          .map((item) => item.id)
      );

      if (removedIds.has(activeMediaId)) {
        setActiveMediaId("");
      }

      return currentItems.filter((item) => item.messageId !== messageId);
    });
  }

  async function loadConversationMedia({
    anchorMessageId = "",
    direction = "",
    fallbackItem = null,
  } = {}) {
    if (!conversationId || mediaRequestRef.current) {
      return [];
    }

    const cursor =
      direction === "older"
        ? mediaPagination.olderCursor
        : direction === "newer"
          ? mediaPagination.newerCursor
          : null;

    if (direction && !cursor) {
      return [];
    }

    const controller = new AbortController();
    mediaRequestRef.current = controller;

    try {
      setIsMediaLoading(true);
      setMediaError("");

      const query = new URLSearchParams({
        limit: "30",
      });

      if (anchorMessageId) {
        query.set("anchorMessageId", anchorMessageId);
      }

      if (direction && cursor) {
        query.set("direction", direction);
        query.set("cursor", cursor);
      }

      const response = await fetch(
        `/api/conversations/${conversationId}/messages/media?${query}`,
        {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Imaginile conversației nu au putut fi încărcate."
        );
      }

      if (activeConversationIdRef.current !== conversationId) {
        return [];
      }

      const incomingItems = Array.isArray(data?.media) ? data.media : [];
      const pagination = data?.pagination || {};

      if (direction) {
        setConversationMedia((currentItems) =>
          mergeMediaItems(currentItems, incomingItems)
        );
        setMediaPagination((currentPagination) => ({
          hasOlder:
            direction === "older"
              ? pagination.hasOlder === true
              : currentPagination.hasOlder,
          hasNewer:
            direction === "newer"
              ? pagination.hasNewer === true
              : currentPagination.hasNewer,
          olderCursor:
            direction === "older"
              ? pagination.olderCursor || currentPagination.olderCursor
              : currentPagination.olderCursor,
          newerCursor:
            direction === "newer"
              ? pagination.newerCursor || currentPagination.newerCursor
              : currentPagination.newerCursor,
        }));
      } else {
        setConversationMedia(
          mergeMediaItems(
            incomingItems,
            fallbackItem ? [fallbackItem] : []
          )
        );
        setMediaPagination({
          hasOlder: pagination.hasOlder === true,
          hasNewer: pagination.hasNewer === true,
          olderCursor: pagination.olderCursor || null,
          newerCursor: pagination.newerCursor || null,
        });
      }

      return incomingItems;
    } catch (error) {
      if (error?.name !== "AbortError") {
        setMediaError(
          error?.message || "Imaginile conversației nu au putut fi încărcate."
        );
      }

      return [];
    } finally {
      if (mediaRequestRef.current === controller) {
        mediaRequestRef.current = null;
        setIsMediaLoading(false);
      }
    }
  }

  function handleOpenImage({ image, imageIndex, messageId }) {
    const sourceMessage = messages.find(
      (message) => message._id === messageId
    );
    const selectedItem = createMediaItem({
      image,
      imageIndex,
      message: sourceMessage,
    });

    if (!selectedItem) {
      return;
    }

    mediaRequestRef.current?.abort();
    mediaRequestRef.current = null;
    setConversationMedia([selectedItem]);
    setActiveMediaId(selectedItem.id);
    setMediaPagination({
      hasOlder: false,
      hasNewer: false,
      olderCursor: null,
      newerCursor: null,
    });
    setMediaError("");

    loadConversationMedia({
      anchorMessageId: messageId,
      fallbackItem: selectedItem,
    });
  }

  function closeMediaViewer() {
    mediaRequestRef.current?.abort();
    mediaRequestRef.current = null;
    setActiveMediaId("");
    setConversationMedia([]);
    setMediaError("");
    setIsMediaLoading(false);
  }

  function handleJumpToMessage(messageId) {
    if (!messageId) {
      return;
    }

    const element = document.getElementById(`message-${messageId}`);

    if (!element) {
      return;
    }

    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.classList.remove("is-highlighted");
    window.requestAnimationFrame(() => {
      element.classList.add("is-highlighted");
      window.setTimeout(() => element.classList.remove("is-highlighted"), 1_800);
    });
  }

  function openReport(target) {
    setReportTarget(target);
  }

  async function handleDeleteConversation() {
    if (!conversationId || isDeletingConversation) {
      return;
    }

    try {
      setIsDeletingConversation(true);
      setDeleteConversationError("");

      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Conversația nu a putut fi ștearsă.");
      }

      setIsDeleteDialogOpen(false);
      onConversationDeleted?.(conversationId);
    } catch (error) {
      setDeleteConversationError(
        error?.message || "Conversația nu a putut fi ștearsă."
      );
    } finally {
      setIsDeletingConversation(false);
    }
  }

  const renderedMessages = messages.map((message, index) => {
        const previousMessage = messages[index - 1];
        const showDateDivider =
          !previousMessage ||
          !isSameCalendarDay(previousMessage.createdAt, message.createdAt);

        return (
          <div className="message-window-message-group" key={message._id}>
            {showDateDivider ? (
              <div className="message-date-divider" role="separator">
                <span>{formatDateDivider(message.createdAt)}</span>
              </div>
            ) : null}

            <MessageBubble
              message={message}
              currentUserId={currentUserId}
              onReply={setReplyTo}
              onMessageUpdated={handleMessageUpdated}
              onMessageRemoved={handleMessageRemoved}
              onReport={openReport}
              onJumpToMessage={handleJumpToMessage}
              onOpenImage={handleOpenImage}
            />
          </div>
        );
      });

  if (!conversation) {
    return (
      <section className="message-window is-empty">
        <div className="message-window-empty-state">
          <span className="message-window-empty-icon">
            <MessageCircleMore size={36} aria-hidden="true" />
          </span>
          <h2>Alege o conversație</h2>
          <p>
            Selectează un călător din listă pentru a vedea mesajele și a
            continua conversația.
          </p>
        </div>
      </section>
    );
  }

  const displayName =
    otherUser?.name ||
    otherUser?.fullName ||
    otherUser?.username ||
    "Utilizator";

  return (
    <section className="message-window">
      <ChatHeader
        user={otherUser}
        isTyping={isOtherUserTyping}
        realtimeStatus={realtimeStatus}
        isDeleting={isDeletingConversation}
        onBack={onBack}
        onDeleteConversation={() => {
          setDeleteConversationError("");
          setIsDeleteDialogOpen(true);
        }}
        onReportConversation={() =>
          openReport({
            targetType: "conversation",
            targetId: conversationId,
            targetLabel: `conversația cu ${displayName}`,
          })
        }
        onReportUser={() =>
          openReport({
            targetType: "user",
            targetId: otherUserId,
            targetLabel: displayName,
          })
        }
      />

      <div
        ref={contentRef}
        className="message-window-content"
        onScroll={() => {
          if (isNearBottom()) {
            setShowNewMessagesButton(false);
          }
        }}
      >
        {isLoading ? (
          <div className="message-window-state" aria-busy="true">
            <LoaderCircle className="is-spinning" size={28} aria-hidden="true" />
            <p>Se încarcă mesajele...</p>
          </div>
        ) : null}

        {!isLoading && loadError ? (
          <div className="message-window-state" role="alert">
            <MessageCircleMore size={34} aria-hidden="true" />
            <h3>Mesajele nu au putut fi încărcate</h3>
            <p>{loadError}</p>
            <button
              type="button"
              className="message-window-retry"
              onClick={() => loadMessages({ mode: "initial" })}
            >
              <RefreshCw size={16} aria-hidden="true" />
              <span>Încearcă din nou</span>
            </button>
          </div>
        ) : null}

        {!isLoading && !loadError && messages.length === 0 ? (
          <div className="message-window-state">
            <MessageCircleMore size={36} aria-hidden="true" />
            <h3>Începe conversația</h3>
            <p>Trimite primul mesaj către {displayName}.</p>
          </div>
        ) : null}

        {!isLoading && !loadError && messages.length > 0 ? (
          <div className="message-window-messages">
            {pagination.hasMore ? (
              <div className="message-window-load-older">
                {olderMessagesError ? (
                  <p role="alert">{olderMessagesError}</p>
                ) : null}
                <button
                  type="button"
                  disabled={isLoadingOlder}
                  onClick={() =>
                    loadMessages({
                      cursor: pagination.nextCursor,
                      mode: "older",
                    })
                  }
                >
                  {isLoadingOlder ? (
                    <LoaderCircle
                      className="is-spinning"
                      size={17}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span>
                    {isLoadingOlder ? "Se încarcă..." : "Mesaje mai vechi"}
                  </span>
                </button>
              </div>
            ) : null}

            {renderedMessages}
            <div ref={messagesEndRef} aria-hidden="true" />
          </div>
        ) : null}

        {showNewMessagesButton ? (
          <button
            type="button"
            className="message-window-new-messages"
            onClick={() => scrollToBottom("smooth")}
          >
            <ArrowDown size={17} aria-hidden="true" />
            <span>Mesaje noi</span>
          </button>
        ) : null}
      </div>

      <MessageInput
        key={conversationId}
        conversationId={conversationId}
        replyTo={replyTo}
        disabled={isLoading || Boolean(loadError) || isDeletingConversation}
        onMessageSent={handleMessageSent}
        onCancelReply={() => setReplyTo(null)}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
      />

      <ReportDialog
        isOpen={Boolean(reportTarget)}
        targetType={reportTarget?.targetType}
        targetId={reportTarget?.targetId}
        targetLabel={reportTarget?.targetLabel}
        onClose={() => setReportTarget(null)}
      />

      <DeleteConversationDialog
        isOpen={isDeleteDialogOpen}
        user={otherUser}
        error={deleteConversationError}
        isDeleting={isDeletingConversation}
        onConfirm={handleDeleteConversation}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeleteConversationError("");
        }}
      />

      <MessageImageViewer
        isOpen={Boolean(activeMediaId)}
        images={conversationMedia}
        activeImageId={activeMediaId}
        pagination={mediaPagination}
        isLoading={isMediaLoading}
        error={mediaError}
        onActiveImageChange={setActiveMediaId}
        onLoadMore={(direction) =>
          loadConversationMedia({ direction })
        }
        onClose={closeMediaViewer}
      />
    </section>
  );
}
