"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";

import ChatDialog from "./chatDialog";
import { getUserInitials } from "../../utils/getUserInitials";

export default function AvatarViewer({
  isOpen = false,
  imageUrl = "",
  displayName = "Utilizator",
  onClose,
}) {
  const closeButtonRef = useRef(null);
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const normalizedImageUrl =
    typeof imageUrl === "string"
      ? imageUrl.trim()
      : "";
  const normalizedDisplayName =
    typeof displayName === "string" && displayName.trim()
      ? displayName.trim()
      : "Utilizator";
  const shouldShowImage =
    Boolean(normalizedImageUrl) &&
    failedImageUrl !== normalizedImageUrl;
  const initials = getUserInitials(
    normalizedDisplayName
  );

  return (
    <ChatDialog
      isOpen={isOpen}
      className="chat-avatar-viewer"
      titleId="chat-avatar-viewer-title"
      descriptionId="chat-avatar-viewer-description"
      initialFocusRef={closeButtonRef}
      onClose={onClose}
    >
      <header className="chat-avatar-viewer-header">
        <div>
          <h2 id="chat-avatar-viewer-title">
            Fotografie de profil
          </h2>

          <p id="chat-avatar-viewer-description">
            {normalizedDisplayName}
          </p>
        </div>

        <button
          ref={closeButtonRef}
          type="button"
          className="chat-avatar-viewer-close"
          onClick={onClose}
          aria-label="Închide fotografia de profil"
          title="Închide"
        >
          <X size={23} aria-hidden="true" />
        </button>
      </header>

      <div className="chat-avatar-viewer-content">
        {shouldShowImage ? (
          // Avatarurile sunt URL-uri Cloudinary dinamice, neconfigurate în next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={normalizedImageUrl}
            alt={`Fotografia de profil a utilizatorului ${normalizedDisplayName}`}
            draggable="false"
            onError={() =>
              setFailedImageUrl(
                normalizedImageUrl
              )
            }
          />
        ) : (
          <div className="chat-avatar-viewer-fallback">
            <strong aria-hidden="true">
              {initials}
            </strong>
            <span>Avatar generat din inițialele numelui.</span>
          </div>
        )}
      </div>
    </ChatDialog>
  );
}
