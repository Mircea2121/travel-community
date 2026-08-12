"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

import ChatDialog from "./chatDialog";

export default function DeleteMessageDialog({
  isOpen = false,
  isMine = false,
  canDeleteForEveryone = false,
  isDeleting = false,
  error = "",
  onConfirm,
  onClose,
}) {
  const [scope, setScope] = useState("me");
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const resetTimer = window.setTimeout(() => {
      setScope("me");
    }, 0);

    return () => window.clearTimeout(resetTimer);
  }, [isOpen]);

  function handleClose() {
    if (!isDeleting) {
      onClose?.();
    }
  }

  function handleConfirm() {
    if (!isDeleting) {
      onConfirm?.(scope);
    }
  }

  return (
    <ChatDialog
      isOpen={isOpen}
      className="chat-delete-message-dialog"
      titleId="chat-delete-message-title"
      descriptionId="chat-delete-message-description"
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
            <h2 id="chat-delete-message-title">Șterge mesajul</h2>
            <p id="chat-delete-message-description">
              Alege pentru cine dorești să elimini mesajul.
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

      <div className="chat-delete-message-content">
        <fieldset
          className="chat-delete-message-options"
          disabled={isDeleting}
        >
          <legend className="sr-only">Opțiuni de ștergere</legend>

          <label
            className={`chat-delete-message-option${
              scope === "me" ? " is-selected" : ""
            }`}
          >
            <input
              type="radio"
              name="deleteMessageScope"
              value="me"
              checked={scope === "me"}
              onChange={() => setScope("me")}
            />

            <span className="chat-delete-message-option-icon">
              <UserRound size={20} aria-hidden="true" />
            </span>

            <span>
              <strong>Șterge pentru mine</strong>
              <small>
                Mesajul dispare numai din conversația ta. Cealaltă persoană
                îl va putea vedea în continuare.
              </small>
            </span>
          </label>

          {isMine && canDeleteForEveryone ? (
            <label
              className={`chat-delete-message-option${
                scope === "everyone" ? " is-selected" : ""
              }`}
            >
              <input
                type="radio"
                name="deleteMessageScope"
                value="everyone"
                checked={scope === "everyone"}
                onChange={() => setScope("everyone")}
              />

              <span className="chat-delete-message-option-icon">
                <Users size={20} aria-hidden="true" />
              </span>

              <span>
                <strong>Șterge pentru toți</strong>
                <small>
                  Conținutul și imaginile vor fi eliminate pentru ambii
                  participanți. Va rămâne marcajul „Mesaj șters”.
                </small>
              </span>
            </label>
          ) : null}
        </fieldset>

        {isMine && !canDeleteForEveryone ? (
          <div className="chat-delete-message-note">
            <AlertTriangle size={18} aria-hidden="true" />
            <span>
              Mesajele pot fi șterse pentru toți numai în prima oră de la
              trimitere.
            </span>
          </div>
        ) : null}

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
          <span>{isDeleting ? "Se șterge..." : "Șterge mesajul"}</span>
        </button>
      </footer>
    </ChatDialog>
  );
}

