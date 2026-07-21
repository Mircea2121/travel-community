"use client";

import { useEffect } from "react";
import {
  AlertTriangle,
  LogOut,
  Trash2,
  X,
} from "lucide-react";

import "./confirmModal.css";

const MODAL_TYPES = {
  danger: {
    icon: Trash2,
    confirmText: "Șterge",
  },

  logout: {
    icon: LogOut,
    confirmText: "Deconectează-te",
  },

  warning: {
    icon: AlertTriangle,
    confirmText: "Continuă",
  },
};

export default function ConfirmModal({
  isOpen,
  type = "danger",
  title = "Ești sigur?",
  description = "Această acțiune nu poate fi anulată.",
  confirmText,
  cancelText = "Anulează",
  isLoading = false,
  onConfirm,
  onClose,
}) {
  const selectedType =
    MODAL_TYPES[type] || MODAL_TYPES.danger;

  const Icon = selectedType.icon;

  const finalConfirmText =
    confirmText || selectedType.confirmText;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (event) => {
    if (
      event.target === event.currentTarget &&
      !isLoading
    ) {
      onClose();
    }
  };

  return (
    <div
      className="confirm-modal-overlay"
      onMouseDown={handleOverlayClick}
      role="presentation"
    >
      <section
        className={`confirm-modal confirm-modal-${type}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
      >
        <button
          type="button"
          className="confirm-modal-close"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Închide fereastra"
        >
          <X size={20} />
        </button>

        <div className="confirm-modal-icon">
          <Icon size={30} strokeWidth={1.9} />
        </div>

        <div className="confirm-modal-content">
          <h2 id="confirm-modal-title">
            {title}
          </h2>

          <p id="confirm-modal-description">
            {description}
          </p>
        </div>

        <div className="confirm-modal-actions">
          <button
            type="button"
            className="confirm-modal-button confirm-modal-cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className="confirm-modal-button confirm-modal-confirm"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="confirm-modal-spinner" />
                Se procesează...
              </>
            ) : (
              finalConfirmText
            )}
          </button>
        </div>
      </section>
    </div>
  );
}