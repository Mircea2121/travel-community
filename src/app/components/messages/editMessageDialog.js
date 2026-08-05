"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  Pencil,
  Save,
  X,
} from "lucide-react";

import { MESSAGE_POLICY } from "@/app/utils/messagePolicy";

import ChatDialog from "./chatDialog";

export default function EditMessageDialog({
  isOpen = false,
  initialText = "",
  allowEmpty = false,
  isSaving = false,
  error = "",
  onSave,
  onClose,
}) {
  const [text, setText] = useState(initialText);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setText(typeof initialText === "string" ? initialText : "");
    }
  }, [initialText, isOpen]);

  const normalizedInitialText =
    typeof initialText === "string" ? initialText : "";
  const trimmedText = text.trim();
  const hasChanged = trimmedText !== normalizedInitialText.trim();
  const isValid =
    text.length <= MESSAGE_POLICY.MAX_TEXT_LENGTH &&
    (allowEmpty || Boolean(trimmedText));

  function handleSubmit(event) {
    event.preventDefault();

    if (!isSaving && isValid && hasChanged) {
      onSave?.(trimmedText);
    }
  }

  function handleClose() {
    if (!isSaving) {
      onClose?.();
    }
  }

  return (
    <ChatDialog
      isOpen={isOpen}
      className="chat-edit-message-dialog"
      titleId="chat-edit-message-title"
      descriptionId="chat-edit-message-description"
      preventClose={isSaving}
      initialFocusRef={textareaRef}
      onClose={handleClose}
    >
      <header className="chat-dialog-header">
        <div className="chat-dialog-heading">
          <span className="chat-dialog-icon chat-dialog-icon-primary">
            <Pencil size={20} aria-hidden="true" />
          </span>

          <div>
            <h2 id="chat-edit-message-title">Editează mesajul</h2>
            <p id="chat-edit-message-description">
              Poți edita mesajul în primele 15 minute de la trimitere.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="chat-dialog-close"
          onClick={handleClose}
          disabled={isSaving}
          aria-label="Închide fereastra"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <form className="chat-dialog-form" onSubmit={handleSubmit}>
        <div className="chat-edit-message-field">
          <label htmlFor="chat-edit-message-text">Mesaj</label>

          <textarea
            ref={textareaRef}
            id="chat-edit-message-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={MESSAGE_POLICY.MAX_TEXT_LENGTH}
            rows={5}
            disabled={isSaving}
            aria-invalid={Boolean(error)}
          />

          <div className="chat-edit-message-counter">
            <span>
              {allowEmpty
                ? "Textul poate fi eliminat deoarece mesajul conține imagini."
                : "Mesajul trebuie să conțină text."}
            </span>
            <span>
              {text.length}/{MESSAGE_POLICY.MAX_TEXT_LENGTH}
            </span>
          </div>
        </div>

        {error ? (
          <div
            className="chat-dialog-message chat-dialog-message-error"
            role="alert"
          >
            <AlertCircle size={18} aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        <footer className="chat-dialog-actions">
          <button
            type="button"
            className="chat-dialog-secondary-button"
            onClick={handleClose}
            disabled={isSaving}
          >
            Anulează
          </button>

          <button
            type="submit"
            className="chat-dialog-primary-button"
            disabled={isSaving || !isValid || !hasChanged}
          >
            <Save size={17} aria-hidden="true" />
            <span>{isSaving ? "Se salvează..." : "Salvează"}</span>
          </button>
        </footer>
      </form>
    </ChatDialog>
  );
}
