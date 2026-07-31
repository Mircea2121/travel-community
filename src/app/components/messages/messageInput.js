"use client";

import { useState } from "react";
import { SendHorizontal } from "lucide-react";

const MESSAGE_MAX_LENGTH = 2000;

export default function MessageInput({
  conversationId,
  onMessageSent,
  disabled = false,
}) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedText = text.trim();

    if (
      !conversationId ||
      !trimmedText ||
      isSending ||
      disabled
    ) {
      return;
    }

    if (trimmedText.length > MESSAGE_MAX_LENGTH) {
      setError(
        `Mesajul poate avea maximum ${MESSAGE_MAX_LENGTH} de caractere.`
      );

      return;
    }

    try {
      setIsSending(true);
      setError("");

      const response = await fetch(
        `/api/conversations/${conversationId}/messages/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: trimmedText,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Mesajul nu a putut fi trimis."
        );
      }

      setText("");

      if (typeof onMessageSent === "function") {
        onMessageSent(data.message);
      }
    } catch (sendError) {
      setError(
        sendError.message ||
          "Mesajul nu a putut fi trimis."
      );
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <div className="message-input-wrapper">
      {error ? (
        <p className="message-input-error">
          {error}
        </p>
      ) : null}

      <form
        className="message-input-form"
        onSubmit={handleSubmit}
      >
        <textarea
          className="message-input-field"
          value={text}
          onChange={(event) => {
            setText(event.target.value);

            if (error) {
              setError("");
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Scrie un mesaj..."
          rows={1}
          maxLength={MESSAGE_MAX_LENGTH}
          disabled={
            disabled ||
            isSending ||
            !conversationId
          }
          aria-label="Scrie un mesaj"
        />

        <button
          type="submit"
          className="message-input-send"
          disabled={
            disabled ||
            isSending ||
            !conversationId ||
            !text.trim()
          }
          aria-label="Trimite mesajul"
          title="Trimite"
        >
          <SendHorizontal size={20} />

          <span>
            {isSending ? "Se trimite..." : "Trimite"}
          </span>
        </button>
      </form>

      <div className="message-input-footer">
        <span>
          Enter pentru trimitere · Shift + Enter pentru rând nou
        </span>

        <span>
          {text.length}/{MESSAGE_MAX_LENGTH}
        </span>
      </div>
    </div>
  );
}