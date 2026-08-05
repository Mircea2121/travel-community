"use client";

import { useRef } from "react";
import {
  AlertTriangle,
  Trash2,
  X,
} from "lucide-react";

import ChatDialog from "./chatDialog";

export default function DeleteConversationDialog({
  isOpen = false,
  user = null,
  error = "",
  isDeleting = false,
  onConfirm,
  onClose,
}) {
  const cancelButtonRef = useRef(null);
  const displayName =
    user?.name ||
    user?.fullName ||
    user?.username ||
    "acest utilizator";

  function handleClose() {
    if (!isDeleting) {
      onClose?.();
    }
  }

  function handleConfirm() {
    if (!isDeleting) {
      onConfirm?.();
    }
  }

  return (
    <ChatDialog
      isOpen={isOpen}
      className="chat-delete-conversation-dialog"
      titleId="chat-delete-conversation-title"
      descriptionId="chat-delete-conversation-description"
      preventClose={isDeleting}
      initialFocusRef={cancelButtonRef}
      onClose={handleClose}
    >
      <header className="chat-dialog-header">
        <div className="chat-dialog-heading">
          <span className="chat-dialog-icon chat-dialog-icon-danger">
            <Trash2 size={20} aria-hidden="true" />
          </span>

          <div>
            <h2 id="chat-delete-conversation-title">
              Șterge conversația
            </h2>
            <p id="chat-delete-conversation-description">
              Conversația cu <strong>{displayName}</strong> va fi eliminată
              numai din lista ta.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="chat-dialog-close"
          onClick={handleClose}
          disabled={isDeleting}
          aria-label="Închide fereastra"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <div className="chat-delete-conversation-content">
        <div className="chat-delete-warning">
          <AlertTriangle size={20} aria-hidden="true" />
          <p>
            Mesajele nu vor fi șterse pentru cealaltă persoană. Conversația
            poate reapărea dacă unul dintre voi trimite un mesaj nou.
          </p>
        </div>

        {error ? (
          <div
            className="chat-dialog-message chat-dialog-message-error"
            role="alert"
          >
            <AlertTriangle size={18} aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}
      </div>

      <footer className="chat-dialog-actions">
        <button
          ref={cancelButtonRef}
          type="button"
          className="chat-dialog-secondary-button"
          onClick={handleClose}
          disabled={isDeleting}
        >
          Anulează
        </button>

        <button
          type="button"
          className="chat-dialog-danger-button"
          onClick={handleConfirm}
          disabled={isDeleting}
        >
          <Trash2 size={17} aria-hidden="true" />
          <span>
            {isDeleting ? "Se șterge..." : "Șterge conversația"}
          </span>
        </button>
      </footer>
    </ChatDialog>
  );
}
