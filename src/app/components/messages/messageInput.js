"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ImagePlus,
  LoaderCircle,
  Reply,
  SendHorizontal,
  Smile,
  X,
} from "lucide-react";

import {
  MESSAGE_IMAGE_POLICY,
  validateMessageImageFiles,
} from "@/app/utils/messageImagePolicy";
import { MESSAGE_POLICY } from "@/app/utils/messagePolicy";

import EmojiPicker from "./emojiPicker";
import ImagePreview from "./imagePreview";

const TYPING_STOP_DELAY_MS = 2_000;
const TEXTAREA_MAX_HEIGHT_PX = 140;

function createLocalImage(file) {
  return {
    id:
      globalThis.crypto?.randomUUID?.() ||
      `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
    file,
    previewUrl: URL.createObjectURL(file),
    status: "ready",
    error: "",
  };
}

function getReplyPreview(replyTo) {
  if (!replyTo) {
    return "";
  }

  if (replyTo.isDeleted) {
    return "Mesaj șters";
  }

  if (typeof replyTo.text === "string" && replyTo.text.trim()) {
    return replyTo.text.trim();
  }

  const imageCount = Array.isArray(replyTo.images)
    ? replyTo.images.length
    : 0;

  if (imageCount === 1) {
    return "Imagine";
  }

  if (imageCount > 1) {
    return `${imageCount} imagini`;
  }

  return "Mesaj";
}

export default function MessageInput({
  conversationId,
  replyTo = null,
  disabled = false,
  onMessageSent,
  onCancelReply,
  onTypingStart,
  onTypingStop,
}) {
  const [text, setText] = useState("");
  const [images, setImages] = useState([]);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const imagesRef = useRef([]);
  const typingTimerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const onTypingStopRef = useRef(onTypingStop);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    onTypingStopRef.current = onTypingStop;
  }, [onTypingStop]);

  useEffect(() => {
    return () => {
      window.clearTimeout(typingTimerRef.current);
      abortControllerRef.current?.abort();

      for (const image of imagesRef.current) {
        if (image.previewUrl) {
          URL.revokeObjectURL(image.previewUrl);
        }
      }
    };
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      TEXTAREA_MAX_HEIGHT_PX
    )}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > TEXTAREA_MAX_HEIGHT_PX ? "auto" : "hidden";
  }, [text]);

  function stopTyping() {
    window.clearTimeout(typingTimerRef.current);
    onTypingStop?.();
  }

  function scheduleTypingStop() {
    window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => {
      onTypingStop?.();
    }, TYPING_STOP_DELAY_MS);
  }

  function handleTextChange(event) {
    if (isSending) {
      return;
    }

    const nextText = event.target.value;

    setText(nextText);
    setError("");

    if (nextText.trim()) {
      onTypingStart?.();
      scheduleTypingStop();
    } else {
      stopTyping();
    }
  }

  function addFiles(fileList) {
    const validation = validateMessageImageFiles(
      fileList,
      images.length
    );

    if (validation.error) {
      setError(validation.error);
      return;
    }

    const existingFiles = new Set(
      images.map(
        (image) =>
          `${image.file.name}:${image.file.size}:${image.file.lastModified}`
      )
    );
    const uniqueFiles = validation.validFiles.filter((file) => {
      const key = `${file.name}:${file.size}:${file.lastModified}`;

      if (existingFiles.has(key)) {
        return false;
      }

      existingFiles.add(key);
      return true;
    });

    if (uniqueFiles.length === 0) {
      setError("Imaginile selectate sunt deja adăugate.");
      return;
    }

    setImages((currentImages) => [
      ...currentImages,
      ...uniqueFiles.map(createLocalImage),
    ]);
    setError("");
  }

  function removeImage(imageId) {
    setImages((currentImages) =>
      currentImages.filter((image) => {
        if (image.id === imageId) {
          if (image.previewUrl) {
            URL.revokeObjectURL(image.previewUrl);
          }

          return false;
        }

        return true;
      })
    );
    setError("");
  }

  function handleFileChange(event) {
    addFiles(event.target.files);
    event.target.value = "";
  }

  function handlePaste(event) {
    const imageFiles = [...(event.clipboardData?.files || [])].filter(
      (file) => file.type.startsWith("image/")
    );

    if (imageFiles.length > 0) {
      event.preventDefault();
      addFiles(imageFiles);
    }
  }

  function handleDragOver(event) {
    if (disabled || isSending) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }

  function handleDragLeave(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsDragging(false);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);

    if (!disabled && !isSending) {
      addFiles(event.dataTransfer.files);
    }
  }

  function handleEmojiSelect(emoji) {
    const textarea = textareaRef.current;
    const selectionStart = textarea?.selectionStart ?? text.length;
    const selectionEnd = textarea?.selectionEnd ?? text.length;
    const nextText =
      text.slice(0, selectionStart) + emoji + text.slice(selectionEnd);

    if (nextText.length > MESSAGE_POLICY.MAX_TEXT_LENGTH) {
      setError(
        `Mesajul poate avea maximum ${MESSAGE_POLICY.MAX_TEXT_LENGTH} de caractere.`
      );
      return;
    }

    setText(nextText);
    setError("");
    onTypingStart?.();
    scheduleTypingStop();

    window.requestAnimationFrame(() => {
      textarea?.focus();
      const nextCursorPosition = selectionStart + emoji.length;
      textarea?.setSelectionRange(nextCursorPosition, nextCursorPosition);
    });
  }

  async function cleanupUploadedImages(uploadedImages) {
    if (!conversationId || uploadedImages.length === 0) {
      return;
    }

    try {
      await fetch(
        `/api/conversations/${conversationId}/messages/upload/cleanup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            images: uploadedImages,
          }),
          keepalive: true,
        }
      );
    } catch {}
  }

  async function uploadImages(signal) {
    if (images.length === 0) {
      return [];
    }

    const formData = new FormData();

    formData.append("conversationId", conversationId);

    for (const image of images) {
      formData.append("images", image.file);
    }

    const response = await fetch(
      `/api/conversations/${conversationId}/messages/upload`,
      {
        method: "POST",
        body: formData,
        signal,
      }
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message || "Imaginile nu au putut fi încărcate."
      );
    }

    return Array.isArray(data?.images) ? data.images : [];
  }

  function clearComposer() {
    setText("");
    setImages((currentImages) => {
      for (const image of currentImages) {
        if (image.previewUrl) {
          URL.revokeObjectURL(image.previewUrl);
        }
      }

      return [];
    });
    setIsEmojiOpen(false);
    onCancelReply?.();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedText = text.trim();

    if (
      !conversationId ||
      (!trimmedText && images.length === 0) ||
      isSending ||
      disabled
    ) {
      return;
    }

    if (trimmedText.length > MESSAGE_POLICY.MAX_TEXT_LENGTH) {
      setError(
        `Mesajul poate avea maximum ${MESSAGE_POLICY.MAX_TEXT_LENGTH} de caractere.`
      );
      return;
    }

    const controller = new AbortController();
    let uploadedImages = [];

    abortControllerRef.current = controller;

    try {
      setIsSending(true);
      setError("");
      setIsEmojiOpen(false);
      stopTyping();
      setImages((currentImages) =>
        currentImages.map((image) => ({
          ...image,
          status: "uploading",
          error: "",
        }))
      );

      uploadedImages = await uploadImages(controller.signal);

      const response = await fetch(
        `/api/conversations/${conversationId}/messages/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: trimmedText,
            images: uploadedImages,
            replyTo: replyTo?._id || null,
          }),
          signal: controller.signal,
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Mesajul nu a putut fi trimis.");
      }

      clearComposer();
      onMessageSent?.(data.message);
    } catch (sendError) {
      await cleanupUploadedImages(uploadedImages);

      if (sendError?.name !== "AbortError") {
        const message =
          sendError?.message || "Mesajul nu a putut fi trimis.";

        setError(message);
        setImages((currentImages) =>
          currentImages.map((image) => ({
            ...image,
            status: "error",
            error: message,
          }))
        );
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }

      setIsSending(false);

      window.requestAnimationFrame(() => {
        textareaRef.current?.focus({ preventScroll: true });
      });
    }
  }

  function handleKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  const isDisabled = disabled || isSending || !conversationId;
  const canSend =
    !isDisabled && (Boolean(text.trim()) || images.length > 0);

  return (
    <div
      className={`message-input-wrapper${
        isDragging ? " is-dragging" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging ? (
        <div className="message-input-dropzone" aria-hidden="true">
          <ImagePlus size={26} />
          <span>Adaugă imaginile în mesaj</span>
        </div>
      ) : null}

      {replyTo ? (
        <div className="message-input-reply">
          <Reply size={17} aria-hidden="true" />
          <span>
            <strong>
              Răspunzi {replyTo.senderId ? "unui mesaj" : "mesajului"}
            </strong>
            <small>{getReplyPreview(replyTo)}</small>
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            disabled={isSending}
            aria-label="Anulează răspunsul"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <ImagePreview
        images={images}
        disabled={isSending}
        onRemove={removeImage}
      />

      {error ? (
        <p className="message-input-error" role="alert">
          {error}
        </p>
      ) : null}

      <form className="message-input-form" onSubmit={handleSubmit}>
        <div className="message-input-tools">
          <button
            type="button"
            className="message-input-tool"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => setIsEmojiOpen((value) => !value)}
            disabled={isDisabled}
            aria-label="Alege un emoji"
            aria-expanded={isEmojiOpen}
            title="Emoji"
          >
            <Smile size={20} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="message-input-tool"
            onClick={() => fileInputRef.current?.click()}
            disabled={
              isDisabled || images.length >= MESSAGE_IMAGE_POLICY.MAX_COUNT
            }
            aria-label="Adaugă imagini"
            title="Adaugă imagini"
          >
            <ImagePlus size={20} aria-hidden="true" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept={MESSAGE_IMAGE_POLICY.ACCEPT_ATTRIBUTE}
            multiple
            hidden
            onChange={handleFileChange}
            disabled={isDisabled}
          />

          <EmojiPicker
            isOpen={isEmojiOpen}
            onSelect={handleEmojiSelect}
            onClose={() => setIsEmojiOpen(false)}
          />
        </div>

        <textarea
          ref={textareaRef}
          className="message-input-field"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={scheduleTypingStop}
          placeholder="Scrie un mesaj..."
          rows={1}
          maxLength={MESSAGE_POLICY.MAX_TEXT_LENGTH}
          disabled={disabled || !conversationId}
          aria-label="Scrie un mesaj"
        />

        <button
          type="submit"
          className="message-input-send"
          onPointerDown={(event) => event.preventDefault()}
          disabled={!canSend}
          aria-label="Trimite mesajul"
          title="Trimite"
        >
          {isSending ? (
            <LoaderCircle
              className="is-spinning"
              size={20}
              aria-hidden="true"
            />
          ) : (
            <SendHorizontal size={20} aria-hidden="true" />
          )}
          <span>{isSending ? "Se trimite..." : "Trimite"}</span>
        </button>
      </form>

      <footer className="message-input-footer">
        <span>Enter pentru trimitere · Shift + Enter pentru rând nou</span>
        <span>
          {text.length}/{MESSAGE_POLICY.MAX_TEXT_LENGTH}
        </span>
      </footer>
    </div>
  );
}
