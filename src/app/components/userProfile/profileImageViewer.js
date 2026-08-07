"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function ProfileImageViewer({
  image,
  onClose,
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    return () => {
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    if (!image) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [image, onClose]);

  if (!isMounted || !image?.url) {
    return null;
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return createPortal(
    <div
      className="profile-image-viewer-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={image.title || "Imagine profil"}
      onClick={handleBackdropClick}
    >
      <header className="profile-image-viewer-header">
        <div>
          <h2>{image.title || "Imagine profil"}</h2>

          {image.subtitle && <p>{image.subtitle}</p>}
        </div>

        <button
          type="button"
          className="profile-image-viewer-close"
          onClick={onClose}
          aria-label="Închide imaginea"
        >
          <X size={28} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </header>

      <div className="profile-image-viewer-stage">
        <img
          src={image.url}
          alt={image.alt || image.title || "Imagine profil"}
          className={`profile-image-viewer-image profile-image-viewer-image-${
            image.type === "cover" ? "cover" : "avatar"
          }`}
        />
      </div>
    </div>,
    document.body
  );
}
