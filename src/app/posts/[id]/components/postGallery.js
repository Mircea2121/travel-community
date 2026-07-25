"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { createPortal } from "react-dom";

import {
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import {
  getImageKey,
  getImageUrl,
} from "../utils/postDetailsHelpers";

export default function PostGallery({
  images = [],
  title = "Postare",
}) {
  const validImages = useMemo(() => {
    if (!Array.isArray(images)) {
      return [];
    }

    return images
      .map((image, index) => ({
        key: getImageKey(
          image,
          index
        ),
        url: getImageUrl(image),
      }))
      .filter((image) =>
        Boolean(image.url)
      );
  }, [images]);

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);

  const [
    isFullscreenOpen,
    setIsFullscreenOpen,
  ] = useState(false);

  const [
    isMounted,
    setIsMounted,
  ] = useState(false);

  const totalImages =
    validImages.length;

  useEffect(() => {
    setIsMounted(true);

    return () => {
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
    setIsFullscreenOpen(false);
  }, [validImages]);

  useEffect(() => {
    if (!isFullscreenOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsFullscreenOpen(false);
      }

      if (
        event.key === "ArrowLeft" &&
        totalImages > 1
      ) {
        setCurrentIndex(
          (current) =>
            current === 0
              ? totalImages - 1
              : current - 1
        );
      }

      if (
        event.key === "ArrowRight" &&
        totalImages > 1
      ) {
        setCurrentIndex(
          (current) =>
            current ===
            totalImages - 1
              ? 0
              : current + 1
        );
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    isFullscreenOpen,
    totalImages,
  ]);

  if (totalImages === 0) {
    return null;
  }

  const currentImage =
    validImages[currentIndex];

  function showPreviousImage(
    event
  ) {
    event?.stopPropagation();

    setCurrentIndex(
      (current) =>
        current === 0
          ? totalImages - 1
          : current - 1
    );
  }

  function showNextImage(event) {
    event?.stopPropagation();

    setCurrentIndex(
      (current) =>
        current ===
        totalImages - 1
          ? 0
          : current + 1
    );
  }

  function openFullscreen() {
    setIsFullscreenOpen(true);
  }

  function closeFullscreen() {
    setIsFullscreenOpen(false);
  }

  function handleBackgroundClick(
    event
  ) {
    if (
      event.target ===
      event.currentTarget
    ) {
      closeFullscreen();
    }
  }

  const fullscreenContent = (
    <div
      className="post-gallery-fullscreen"
      role="dialog"
      aria-modal="true"
      aria-label="Galerie foto"
      onClick={
        handleBackgroundClick
      }
    >
      <button
        type="button"
        className="post-gallery-fullscreen-close"
        onClick={closeFullscreen}
        aria-label="Închide galeria"
      >
        <X
          size={30}
          strokeWidth={2.2}
        />
      </button>

      {totalImages > 1 && (
        <button
          type="button"
          className="post-gallery-fullscreen-arrow post-gallery-fullscreen-arrow-left"
          onClick={
            showPreviousImage
          }
          aria-label="Imaginea anterioară"
        >
          <ChevronLeft
            size={38}
            strokeWidth={2.2}
          />
        </button>
      )}

      <img
        src={currentImage.url}
        alt={`${title} - poza ${
          currentIndex + 1
        }`}
        className="post-gallery-fullscreen-image"
      />

      {totalImages > 1 && (
        <>
          <button
            type="button"
            className="post-gallery-fullscreen-arrow post-gallery-fullscreen-arrow-right"
            onClick={showNextImage}
            aria-label="Imaginea următoare"
          >
            <ChevronRight
              size={38}
              strokeWidth={2.2}
            />
          </button>

          <span className="post-gallery-fullscreen-counter">
            {currentIndex + 1} /{" "}
            {totalImages}
          </span>
        </>
      )}
    </div>
  );

  return (
    <>
      <div className="post-gallery">
        <button
          type="button"
          className="post-gallery-image-button"
          onClick={openFullscreen}
          aria-label="Deschide imaginea pe tot ecranul"
        >
          <img
            key={currentImage.key}
            src={currentImage.url}
            alt={`${title} - poza ${
              currentIndex + 1
            }`}
            className="post-details-image"
          />
        </button>

        {totalImages > 1 && (
          <>
            <button
              type="button"
              className="post-gallery-arrow post-gallery-arrow-left"
              onClick={
                showPreviousImage
              }
              aria-label="Imaginea anterioară"
            >
              <ChevronLeft
                size={28}
                strokeWidth={2.4}
              />
            </button>

            <button
              type="button"
              className="post-gallery-arrow post-gallery-arrow-right"
              onClick={showNextImage}
              aria-label="Imaginea următoare"
            >
              <ChevronRight
                size={28}
                strokeWidth={2.4}
              />
            </button>

            <span className="post-gallery-counter">
              {currentIndex + 1} /{" "}
              {totalImages}
            </span>
          </>
        )}
      </div>

      {isMounted &&
        isFullscreenOpen &&
        createPortal(
          fullscreenContent,
          document.body
        )}
    </>
  );
}