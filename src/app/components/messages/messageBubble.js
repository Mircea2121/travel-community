"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  Check,
  CheckCheck,
  Copy,
  Flag,
  MoreHorizontal,
  Pencil,
  Reply,
  Trash2,
} from "lucide-react";

import {
  canDeleteMessageForEveryone,
  canEditMessage,
} from "@/app/utils/messagePolicy";
import { MESSAGE_REACTIONS } from "@/app/utils/messageReactions";

import DeleteMessageDialog from "./deleteMessageDialog";
import EditMessageDialog from "./editMessageDialog";
import MessageImageGallery from "./messageImageGallery";
import ReactionBar from "./reactionBar";

const ACTIONS_MENU_GAP_PX = 8;
const ACTIONS_MENU_VIEWPORT_MARGIN_PX = 8;

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

function formatMessageDateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getReplyPreviewText(replyTo) {
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

function getReactionGroups(reactions) {
  const groups = new Map();

  for (const reaction of Array.isArray(reactions) ? reactions : []) {
    if (!reaction?.type) {
      continue;
    }

    groups.set(reaction.type, (groups.get(reaction.type) || 0) + 1);
  }

  return MESSAGE_REACTIONS.map((reaction) => ({
    ...reaction,
    count: groups.get(reaction.type) || 0,
  })).filter((reaction) => reaction.count > 0);
}

export default function MessageBubble({
  message,
  currentUserId,
  onReply,
  onMessageUpdated,
  onMessageRemoved,
  onReport,
  onJumpToMessage,
  onOpenImage,
}) {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [menuPosition, setMenuPosition] = useState(null);
  const menuRef = useRef(null);
  const menuTriggerRef = useRef(null);
  const actionsMenuRef = useRef(null);

  const isMine = message?.senderId === currentUserId;
  const isDeleted = message?.isDeleted === true;
  const images = Array.isArray(message?.images) ? message.images : [];
  const reactions = Array.isArray(message?.reactions)
    ? message.reactions
    : [];
  const currentReaction =
    reactions.find((reaction) => reaction.userId === currentUserId)?.type ||
    "";
  const reactionGroups = getReactionGroups(reactions);
  const formattedTime = formatMessageTime(message?.createdAt);
  const formattedDateTime = formatMessageDateTime(message?.createdAt);
  const mayEdit =
    isMine && !isDeleted && canEditMessage(message?.createdAt);
  const mayDeleteForEveryone =
    isMine &&
    !isDeleted &&
    canDeleteMessageForEveryone(message?.createdAt);

  useEffect(() => {
    if (!isActionsOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      const clickedTriggerArea = menuRef.current?.contains(event.target);
      const clickedMenu = actionsMenuRef.current?.contains(event.target);

      if (!clickedTriggerArea && !clickedMenu) {
        setIsActionsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsActionsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isActionsOpen]);

  useEffect(() => {
    if (!isActionsOpen) {
      return undefined;
    }

    function updateMenuPosition() {
      const trigger = menuTriggerRef.current;
      const menu = actionsMenuRef.current;

      if (!trigger) {
        return;
      }

      const triggerRect = trigger.getBoundingClientRect();
      const menuWidth = menu?.offsetWidth || 190;
      const menuHeight = menu?.offsetHeight || 190;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const preferredLeft = isMine
        ? triggerRect.right - menuWidth
        : triggerRect.left;
      const left = Math.min(
        Math.max(preferredLeft, ACTIONS_MENU_VIEWPORT_MARGIN_PX),
        Math.max(
          ACTIONS_MENU_VIEWPORT_MARGIN_PX,
          viewportWidth - menuWidth - ACTIONS_MENU_VIEWPORT_MARGIN_PX
        )
      );
      const fitsBelow =
        triggerRect.bottom + ACTIONS_MENU_GAP_PX + menuHeight <=
        viewportHeight - ACTIONS_MENU_VIEWPORT_MARGIN_PX;
      const top = fitsBelow
        ? triggerRect.bottom + ACTIONS_MENU_GAP_PX
        : Math.max(
            ACTIONS_MENU_VIEWPORT_MARGIN_PX,
            triggerRect.top - ACTIONS_MENU_GAP_PX - menuHeight
          );

      setMenuPosition({ top, left });
    }

    updateMenuPosition();
    const animationFrame = window.requestAnimationFrame(updateMenuPosition);

    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isActionsOpen, isMine]);

  async function handleReaction(nextType) {
    if (isMine || isReacting || isDeleted) {
      return;
    }

    const previousMessage = message;
    const now = new Date().toISOString();
    const optimisticReactions = reactions.filter(
      (reaction) => reaction.userId !== currentUserId
    );

    if (nextType) {
      optimisticReactions.push({
        userId: currentUserId,
        type: nextType,
        createdAt: now,
        updatedAt: now,
      });
    }

    onMessageUpdated?.({
      ...message,
      reactions: optimisticReactions,
    });

    try {
      setIsReacting(true);
      setActionError("");

      const response = await fetch(
        `/api/conversations/${message.conversationId}/messages/${message._id}/reactions`,
        {
          method: nextType ? "PUT" : "DELETE",
          headers: nextType
            ? {
                "Content-Type": "application/json",
              }
            : undefined,
          body: nextType
            ? JSON.stringify({
                type: nextType,
              })
            : undefined,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Reacția nu a putut fi actualizată."
        );
      }

      if (data?.message) {
        onMessageUpdated?.(data.message);
      }
    } catch (error) {
      onMessageUpdated?.(previousMessage);
      setActionError(
        error?.message || "Reacția nu a putut fi actualizată."
      );
    } finally {
      setIsReacting(false);
    }
  }

  async function handleEdit(text) {
    try {
      setIsSaving(true);
      setActionError("");

      const response = await fetch(
        `/api/conversations/${message.conversationId}/messages/${message._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Mesajul nu a putut fi editat.");
      }

      onMessageUpdated?.(data.message);
      setIsEditOpen(false);
    } catch (error) {
      setActionError(error?.message || "Mesajul nu a putut fi editat.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(scope) {
    try {
      setIsDeleting(true);
      setActionError("");

      const response = await fetch(
        `/api/conversations/${message.conversationId}/messages/${message._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ scope }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Mesajul nu a putut fi șters.");
      }

      if (scope === "me") {
        onMessageRemoved?.(message._id);
      } else if (data?.message) {
        onMessageUpdated?.(data.message);
      }

      setIsDeleteOpen(false);
    } catch (error) {
      setActionError(error?.message || "Mesajul nu a putut fi șters.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleCopy() {
    setIsActionsOpen(false);

    try {
      await navigator.clipboard.writeText(message?.text || "");
      setActionError("");
    } catch {
      setActionError("Textul nu a putut fi copiat.");
    }
  }

  function openEditDialog() {
    setActionError("");
    setIsActionsOpen(false);
    setIsEditOpen(true);
  }

  function openDeleteDialog() {
    setActionError("");
    setIsActionsOpen(false);
    setIsDeleteOpen(true);
  }

  function toggleActionsMenu() {
    if (!isActionsOpen) {
      setMenuPosition(null);
    }

    setIsActionsOpen((value) => !value);
  }

  return (
    <article
      id={`message-${message?._id}`}
      className={`message-row ${isMine ? "is-mine" : "is-other"}`}
      data-message-id={message?._id}
    >
      {!isDeleted ? (
        <div
          className={`message-bubble-side-actions ${
            isMine ? "is-mine" : "is-other"
          }`}
          ref={menuRef}
        >
          {!isMine ? (
            <ReactionBar
              currentReaction={currentReaction}
              placement="left"
              isUpdating={isReacting}
              onReaction={handleReaction}
            />
          ) : null}

          <div className="message-bubble-external-actions">
            <button
              ref={menuTriggerRef}
              type="button"
              className="message-bubble-actions-trigger"
              onClick={toggleActionsMenu}
              aria-label="Opțiunile mesajului"
              aria-haspopup="menu"
              aria-expanded={isActionsOpen}
            >
              <MoreHorizontal size={17} aria-hidden="true" />
            </button>

            {isActionsOpen && typeof document !== "undefined"
              ? createPortal(
              <div
                ref={actionsMenuRef}
                className="message-bubble-actions-menu"
                role="menu"
                style={
                  menuPosition
                    ? {
                        top: `${menuPosition.top}px`,
                        left: `${menuPosition.left}px`,
                        visibility: "visible",
                      }
                    : undefined
                }
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsActionsOpen(false);
                    onReply?.(message);
                  }}
                >
                  <Reply size={16} aria-hidden="true" />
                  <span>Răspunde</span>
                </button>

                {message?.text ? (
                  <button type="button" role="menuitem" onClick={handleCopy}>
                    <Copy size={16} aria-hidden="true" />
                    <span>Copiază textul</span>
                  </button>
                ) : null}

                {mayEdit ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={openEditDialog}
                  >
                    <Pencil size={16} aria-hidden="true" />
                    <span>Editează</span>
                  </button>
                ) : null}

                {!isMine ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsActionsOpen(false);
                      onReport?.({
                        targetType: "message",
                        targetId: message._id,
                        targetLabel: "acest mesaj",
                      });
                    }}
                  >
                    <Flag size={16} aria-hidden="true" />
                    <span>Raportează</span>
                  </button>
                ) : null}

                <button
                  type="button"
                  role="menuitem"
                  className="is-danger"
                  onClick={openDeleteDialog}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  <span>Șterge</span>
                </button>
              </div>,
              document.body
            )
              : null}
          </div>
        </div>
      ) : null}

      <div className="message-bubble-column">
        <div
          className={`message-bubble ${isMine ? "is-mine" : "is-other"}${
            images.length > 0 ? " has-images" : ""
          }${isDeleted ? " is-deleted" : ""}`}
        >
          {!isDeleted && message?.replyTo ? (
            <button
              type="button"
              className="message-bubble-reply-preview"
              onClick={() => onJumpToMessage?.(message.replyTo._id)}
            >
              <Reply size={14} aria-hidden="true" />
              <span>
                <strong>
                  {message.replyTo.senderId === currentUserId
                    ? "Tu"
                    : "Mesaj citat"}
                </strong>
                <small>{getReplyPreviewText(message.replyTo)}</small>
              </span>
            </button>
          ) : null}

          {isDeleted ? (
            <p className="message-bubble-deleted">
              <Trash2 size={15} aria-hidden="true" />
              <span>Mesaj șters</span>
            </p>
          ) : (
            <>
              {images.length > 0 ? (
                <MessageImageGallery
                  images={images}
                  onOpenImage={(image, imageIndex) =>
                    onOpenImage?.({
                      image,
                      imageIndex,
                      messageId: message._id,
                      conversationId: message.conversationId,
                    })
                  }
                />
              ) : null}

              {message?.text ? (
                <p className="message-bubble-text">{message.text}</p>
              ) : null}
            </>
          )}

          <footer
            className="message-bubble-meta"
            title={formattedDateTime}
          >
            {message?.isEdited && !isDeleted ? (
              <span className="message-bubble-edited">editat</span>
            ) : null}

            {formattedTime ? (
              <time dateTime={message.createdAt}>{formattedTime}</time>
            ) : null}

            {isMine ? (
              <span
                className={`message-bubble-status${
                  message?.isRead ? " is-read" : ""
                }`}
                aria-label={message?.isRead ? "Mesaj citit" : "Mesaj trimis"}
              >
                {message?.isRead ? (
                  <CheckCheck size={15} aria-hidden="true" />
                ) : (
                  <Check size={15} aria-hidden="true" />
                )}
              </span>
            ) : null}
          </footer>
        </div>

        {reactionGroups.length > 0 ? (
          <div className="message-reaction-summary" aria-label="Reacții">
            {reactionGroups.map((reaction) => (
              <span
                key={reaction.type}
                className={
                  reaction.type === currentReaction ? "is-mine" : ""
                }
                title={`${reaction.label}: ${reaction.count}`}
              >
                <span aria-hidden="true">{reaction.emoji}</span>
                <small>{reaction.count}</small>
              </span>
            ))}
          </div>
        ) : null}

        {actionError ? (
          <p className="message-bubble-error" role="alert">
            {actionError}
          </p>
        ) : null}
      </div>

      <EditMessageDialog
        isOpen={isEditOpen}
        initialText={message?.text || ""}
        allowEmpty={images.length > 0}
        isSaving={isSaving}
        error={isEditOpen ? actionError : ""}
        onSave={handleEdit}
        onClose={() => {
          setIsEditOpen(false);
          setActionError("");
        }}
      />

      <DeleteMessageDialog
        isOpen={isDeleteOpen}
        isMine={isMine}
        canDeleteForEveryone={mayDeleteForEveryone}
        isDeleting={isDeleting}
        error={isDeleteOpen ? actionError : ""}
        onConfirm={handleDelete}
        onClose={() => {
          setIsDeleteOpen(false);
          setActionError("");
        }}
      />
    </article>
  );
}
