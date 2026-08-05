"use client";

import {
  AlertCircle,
  ImageOff,
  LoaderCircle,
  X,
} from "lucide-react";

function formatFileSize(value) {
  const bytes = Number(value);

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(Math.round(bytes / 1024), 1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getImageUrl(image) {
  if (typeof image?.previewUrl === "string") {
    return image.previewUrl;
  }

  if (typeof image?.url === "string") {
    return image.url;
  }

  return "";
}

function getImageName(image, index) {
  return (
    image?.file?.name ||
    image?.originalName ||
    `Imaginea ${index + 1}`
  );
}

export default function ImagePreview({
  images = [],
  disabled = false,
  onRemove,
}) {
  if (!Array.isArray(images) || images.length === 0) {
    return null;
  }

  return (
    <section
      className="message-image-preview"
      aria-label={`${images.length} ${
        images.length === 1
          ? "imagine selectată"
          : "imagini selectate"
      }`}
    >
      <header className="message-image-preview-header">
        <span>
          {images.length}/5 {images.length === 1 ? "imagine" : "imagini"}
        </span>

        <span>JPG, PNG sau WEBP · maximum 8 MB</span>
      </header>

      <div className="message-image-preview-list">
        {images.map((image, index) => {
          const imageId = image?.id || `${index}`;
          const imageUrl = getImageUrl(image);
          const imageName = getImageName(image, index);
          const imageSize = formatFileSize(
            image?.file?.size ?? image?.bytes
          );
          const isUploading = image?.status === "uploading";
          const hasError = image?.status === "error";

          return (
            <article
              key={imageId}
              className={`message-image-preview-item${
                isUploading ? " is-uploading" : ""
              }${hasError ? " has-error" : ""}`}
            >
              <div className="message-image-preview-media">
                {imageUrl ? (
                  <img src={imageUrl} alt={imageName} />
                ) : (
                  <span className="message-image-preview-placeholder">
                    <ImageOff size={22} aria-hidden="true" />
                  </span>
                )}

                {isUploading ? (
                  <span
                    className="message-image-preview-overlay"
                    aria-label="Imaginea se încarcă"
                  >
                    <LoaderCircle
                      className="is-spinning"
                      size={22}
                      aria-hidden="true"
                    />
                  </span>
                ) : null}

                {hasError ? (
                  <span
                    className="message-image-preview-overlay is-error"
                    aria-label="Imaginea nu a putut fi încărcată"
                  >
                    <AlertCircle size={22} aria-hidden="true" />
                  </span>
                ) : null}
              </div>

              <div className="message-image-preview-info">
                <strong title={imageName}>{imageName}</strong>
                {imageSize ? <span>{imageSize}</span> : null}
                {hasError && image?.error ? (
                  <span className="message-image-preview-error">
                    {image.error}
                  </span>
                ) : null}
              </div>

              <button
                type="button"
                className="message-image-preview-remove"
                onClick={() => onRemove?.(imageId)}
                disabled={disabled || isUploading}
                aria-label={`Elimină ${imageName}`}
                title="Elimină imaginea"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
