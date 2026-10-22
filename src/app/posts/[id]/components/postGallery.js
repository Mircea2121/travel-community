"use client";

/* eslint-disable @next/next/no-img-element -- Imagine fullscreen interactivă cu dimensiuni naturale variabile. Imagine de galerie interactivă controlată de viewer și containerul responsive. */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./postGallery.css";
import Image from "next/image";
import { createPortal } from "react-dom";

import {
  ChevronLeft,
  Maximize2,
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

  const galleryTriggerRef = useRef(null);
  const fullscreenCloseRef = useRef(null);
  const fullscreenDialogRef = useRef(null);

  const totalImages =
    validImages.length;

  useEffect(() => {
    const mountTimer = window.setTimeout(() => {
      setIsMounted(true);
    }, 0);

    return () => {
      window.clearTimeout(mountTimer);
    };
  }, []);

  useEffect(() => {
    const resetTimer = window.setTimeout(() => {
      setCurrentIndex(0);
      setIsFullscreenOpen(false);
    }, 0);

    return () => {
      window.clearTimeout(resetTimer);
    };
  }, [validImages]);

  useEffect(() => {
    if (!isFullscreenOpen) {
      return undefined;
    }

    const previousFocus = document.activeElement;
    fullscreenCloseRef.current?.focus();
    function handleKeyDown(event) {
      if (event.key === "Tab") {
        const buttons=fullscreenDialogRef.current?.querySelectorAll("button:not(:disabled)");
        if(buttons?.length) {
          const first=buttons[0], last=buttons[buttons.length-1];
          if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
          else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
        }
      }
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
      if(previousFocus?.isConnected) previousFocus.focus();
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
      ref={fullscreenDialogRef}
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
        ref={fullscreenCloseRef}
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
          ref={galleryTriggerRef}
          className="post-gallery-image-button"
          onClick={openFullscreen}
          aria-label="Vezi fotografia pe tot ecranul"
        >
          {currentImage.url.startsWith("https://res.cloudinary.com/") ? (
            <Image key={currentImage.key} src={currentImage.url} alt={title+" - poza "+(currentIndex+1)} fill sizes="(max-width: 760px) calc(100vw - 28px), (max-width: 1176px) calc(100vw - 56px), 1120px" quality={75} preload={currentIndex === 0} className="post-details-image" />
          ) : (
          <img
            key={currentImage.key}
            src={currentImage.url}
            alt={`${title} - poza ${
              currentIndex + 1
            }`}
            className="post-details-image"
          />

          )}
          <span className="post-gallery-expand-label" aria-hidden="true"><Maximize2 size={14} /> Vezi fotografia</span>
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
