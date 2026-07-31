"use client";

import { useCallback, useEffect, useState } from "react";

import ConversationList from "@/app/components/messages/conversationList";
import MessageWindow from "@/app/components/messages/messageWindow";

import "./messages.css";

export default function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] =
    useState(null);

  const [currentUserId, setCurrentUserId] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/conversations", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Conversațiile nu au putut fi încărcate."
        );
      }

      setConversations(
        Array.isArray(data?.conversations)
          ? data.conversations
          : []
      );

      setCurrentUserId(data?.currentUserId || "");

      setSelectedConversationId((currentConversationId) => {
        if (currentConversationId) {
          return currentConversationId;
        }

        return data?.conversations?.[0]?._id || null;
      });

      setError("");
    } catch (loadError) {
      setError(
        loadError.message ||
          "Conversațiile nu au putut fi încărcate."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const selectedConversation =
    conversations.find(
      (conversation) =>
        conversation._id === selectedConversationId
    ) || null;

  function handleSelectConversation(conversationId) {
    setSelectedConversationId(conversationId);

    setConversations((currentConversations) =>
      currentConversations.map((conversation) =>
        conversation._id === conversationId
          ? {
              ...conversation,
              unreadCount: 0,
            }
          : conversation
      )
    );
  }

  function handleMessageSent(message) {
    setConversations((currentConversations) => {
      const updatedConversations =
        currentConversations.map((conversation) => {
          if (
            conversation._id !== message.conversationId
          ) {
            return conversation;
          }

          return {
            ...conversation,
            lastMessage: message.text,
            lastMessageSenderId: message.senderId,
            lastMessageAt: message.createdAt,
            updatedAt: message.createdAt,
          };
        });

      return [...updatedConversations].sort(
        (firstConversation, secondConversation) => {
          const firstDate = new Date(
            firstConversation.lastMessageAt ||
              firstConversation.updatedAt ||
              0
          ).getTime();

          const secondDate = new Date(
            secondConversation.lastMessageAt ||
              secondConversation.updatedAt ||
              0
          ).getTime();

          return secondDate - firstDate;
        }
      );
    });
  }

  return (
    <main className="messages-page">
      <section className="messages-shell">
        <ConversationList
          conversations={conversations}
          selectedConversationId={
            selectedConversationId
          }
          currentUserId={currentUserId}
          isLoading={isLoading}
          error={error}
          onSelectConversation={
            handleSelectConversation
          }
          onRetry={loadConversations}
        />

        <MessageWindow
          conversation={selectedConversation}
          currentUserId={currentUserId}
          onMessageSent={handleMessageSent}
        />
      </section>
    </main>
  );
}