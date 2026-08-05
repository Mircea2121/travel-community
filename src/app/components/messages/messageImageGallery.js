"use client";

import { Image as ImageIcon } from "lucide-react";

function getImageAlt(image, index) {
  return image?.originalName || `Imaginea ${index + 1} din mesaj`;
}

export default function MessageImageGallery({
  images = [],
  onOpenImage,
}) {
  const validImages = Array.isArray(images)
    ? images.filter(
        (image) =>
          image &&
          typeof image.url === "string" &&
          image.url.trim()
      )
    : [];

  if (validImages.length === 0) {
    return null;
  }

  return (
    <div
      className={`message-image-gallery message-image-gallery-${Math.min(
        validImages.length,
        5
      )}`}
      aria-label={`${validImages.length} ${
        validImages.length === 1 ? "imagine" : "imagini"
      } în mesaj`}
    >
      {validImages.map((image, index) => (
        <button
          key={image.publicId || `${image.url}-${index}`}
          type="button"
          className="message-image-gallery-item"
          onClick={() => onOpenImage?.(image, index)}
          aria-label={`Deschide ${getImageAlt(image, index)}`}
        >
          <img
            src={image.url}
            alt={getImageAlt(image, index)}
            loading="lazy"
            decoding="async"
          />

          <span className="message-image-gallery-open" aria-hidden="true">
            <ImageIcon size={18} />
          </span>
        </button>
      ))}
    </div>
  );
}
