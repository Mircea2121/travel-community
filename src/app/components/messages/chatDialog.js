"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export default function ChatDialog({
  isOpen = false,
  className = "",
  titleId,
  descriptionId,
  preventClose = false,
  initialFocusRef,
  onClose,
  children,
}) {
  const [isMounted, setIsMounted] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    const mountTimer = window.setTimeout(() => {
      setIsMounted(true);
    }, 0);

    return () => {
      window.clearTimeout(mountTimer);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !isMounted) {
      return undefined;
    }

    const previousActiveElement = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const focusTimer = window.setTimeout(() => {
      const preferredElement = initialFocusRef?.current;
      const firstFocusableElement =
        dialogRef.current?.querySelector(FOCUSABLE_SELECTOR);

      (preferredElement || firstFocusableElement || dialogRef.current)?.focus();
    }, 0);

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();

        if (!preventClose) {
          onClose?.();
        }

        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusableElements = [
        ...dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR),
      ];

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === lastElement
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;

      if (
        previousActiveElement &&
        typeof previousActiveElement.focus === "function"
      ) {
        previousActiveElement.focus();
      }
    };
  }, [
    initialFocusRef,
    isMounted,
    isOpen,
    onClose,
    preventClose,
  ]);

  if (!isMounted || !isOpen) {
    return null;
  }

  function handleBackdropPointerDown(event) {
    if (
      event.target === event.currentTarget &&
      !preventClose
    ) {
      onClose?.();
    }
  }

  return createPortal(
    <div
      className="chat-dialog-backdrop"
      role="presentation"
      onPointerDown={handleBackdropPointerDown}
    >
      <section
        ref={dialogRef}
        className={`chat-dialog${className ? ` ${className}` : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        {children}
      </section>
    </div>,
    document.body
  );
}
