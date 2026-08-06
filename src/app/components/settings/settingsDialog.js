"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function SettingsDialog({
  isOpen,
  title,
  description,
  children,
  onClose,
}) {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="settings-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <section
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
        aria-describedby="settings-dialog-description"
      >
        <header className="settings-dialog-header">
          <div>
            <h2 id="settings-dialog-title">
              {title}
            </h2>
            <p id="settings-dialog-description">
              {description}
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="settings-dialog-close"
            onClick={onClose}
            aria-label="Închide fereastra"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </header>

        {children}
      </section>
    </div>
  );
}
