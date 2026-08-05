"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  LoaderCircle,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import ChatDialog from "./chatDialog";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SCALE_STEP = 0.25;
const SWIPE_THRESHOLD_PX = 55;
const DOUBLE_TAP_DELAY_MS = 280;

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function getImageName(image) {
  return image?.originalName || "Imagine din conversație";
}

export default function MessageImageViewer({
  isOpen = false,
  images = [],
  activeImageId = "",
  pagination = {},
  isLoading = false,
  error = "",
  onActiveImageChange,
  onLoadMore,
  onClose,
}) {
  const [scale, setScale] = useState(MIN_SCALE);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const closeButtonRef = useRef(null);
  const stageRef = useRef(null);
  const pointerRef = useRef(null);
  const lastTapAtRef = useRef(0);

  const safeImages = useMemo(
    () =>
      (Array.isArray(images) ? images : []).filter(
        (image) =>
          image?.id &&
          typeof image.url === "string" &&
          image.url.trim()
      ),
    [images]
  );
  const activeIndex = safeImages.findIndex(
    (image) => image.id === activeImageId
  );
  const activeImage = activeIndex >= 0 ? safeImages[activeIndex] : null;
  const hasOlder = pagination?.hasOlder === true;
  const hasNewer = pagination?.hasNewer === true;
  const canGoPrevious = activeIndex > 0 || hasOlder;
  const canGoNext =
    (activeIndex >= 0 && activeIndex < safeImages.length - 1) || hasNewer;

  const resetView = useCallback(() => {
    setScale(MIN_SCALE);
    setPan({ x: 0, y: 0 });
    setIsDragging(false);
    pointerRef.current = null;
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(resetView, 0);

    return () => window.clearTimeout(timeout);
  }, [activeImageId, resetView]);

  const updateScale = useCallback((nextScaleOrUpdater) => {
    setScale((currentScale) => {
      const requestedScale =
        typeof nextScaleOrUpdater === "function"
          ? nextScaleOrUpdater(currentScale)
          : nextScaleOrUpdater;
      const nextScale = clamp(
        Number(requestedScale) || MIN_SCALE,
        MIN_SCALE,
        MAX_SCALE
      );

      if (nextScale === MIN_SCALE) {
        setPan({ x: 0, y: 0 });
      }

      return nextScale;
    });
  }, []);

  const navigate = useCallback(
    async (direction) => {
      if (isNavigating || !activeImage) {
        return;
      }

      const isPrevious = direction === "older";
      const nextIndex = activeIndex + (isPrevious ? -1 : 1);

      if (safeImages[nextIndex]) {
        onActiveImageChange?.(safeImages[nextIndex].id);
        return;
      }

      const canLoad = isPrevious ? hasOlder : hasNewer;

      if (!canLoad || typeof onLoadMore !== "function") {
        return;
      }

      try {
        setIsNavigating(true);
        const loadedImages = await onLoadMore(direction);
        const validLoadedImages = Array.isArray(loadedImages)
          ? loadedImages.filter((image) => image?.id)
          : [];
        const nextImage = isPrevious
          ? validLoadedImages[validLoadedImages.length - 1]
          : validLoadedImages[0];

        if (nextImage?.id) {
          onActiveImageChange?.(nextImage.id);
        }
      } finally {
        setIsNavigating(false);
      }
    },
    [
      activeImage,
      activeIndex,
      hasNewer,
      hasOlder,
      isNavigating,
      onActiveImageChange,
      onLoadMore,
      safeImages,
    ]
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigate("older");
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        navigate("newer");
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        updateScale((currentScale) => currentScale + SCALE_STEP);
      } else if (event.key === "-") {
        event.preventDefault();
        updateScale((currentScale) => currentScale - SCALE_STEP);
      } else if (event.key === "0") {
        event.preventDefault();
        resetView();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, navigate, resetView, updateScale]);

  useEffect(() => {
    const stage = stageRef.current;

    if (!isOpen || !stage) {
      return undefined;
    }

    function handleWheel(event) {
      event.preventDefault();
      const direction = event.deltaY < 0 ? 1 : -1;

      updateScale(
        (currentScale) => currentScale + direction * SCALE_STEP
      );
    }

    stage.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    return () => stage.removeEventListener("wheel", handleWheel);
  }, [isOpen, updateScale]);

  function toggleZoom() {
    if (scale > MIN_SCALE) {
      resetView();
    } else {
      updateScale(2);
    }
  }

  function handlePointerDown(event) {
    if (
      !activeImage ||
      event.button !== 0 ||
      event.target.closest("button")
    ) {
      return;
    }

    pointerRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      initialPanX: pan.x,
      initialPanY: pan.y,
      pointerType: event.pointerType,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);

    if (scale > MIN_SCALE) {
      setIsDragging(true);
    }
  }

  function handlePointerMove(event) {
    const pointer = pointerRef.current;

    if (!pointer || pointer.pointerId !== event.pointerId) {
      return;
    }

    if (scale <= MIN_SCALE) {
      return;
    }

    const stage = stageRef.current;
    const maximumX = ((stage?.clientWidth || 0) * (scale - 1)) / 2;
    const maximumY = ((stage?.clientHeight || 0) * (scale - 1)) / 2;

    setPan({
      x: clamp(
        pointer.initialPanX + event.clientX - pointer.startX,
        -maximumX,
        maximumX
      ),
      y: clamp(
        pointer.initialPanY + event.clientY - pointer.startY,
        -maximumY,
        maximumY
      ),
    });
  }

  function handlePointerEnd(event) {
    const pointer = pointerRef.current;

    if (!pointer || pointer.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - pointer.startX;
    const deltaY = event.clientY - pointer.startY;
    const isTap = Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8;

    if (
      scale === MIN_SCALE &&
      Math.abs(deltaX) >= SWIPE_THRESHOLD_PX &&
      Math.abs(deltaX) > Math.abs(deltaY)
    ) {
      navigate(deltaX > 0 ? "older" : "newer");
    } else if (isTap && pointer.pointerType === "touch") {
      const now = Date.now();

      if (now - lastTapAtRef.current <= DOUBLE_TAP_DELAY_MS) {
        toggleZoom();
        lastTapAtRef.current = 0;
      } else {
        lastTapAtRef.current = now;
      }
    }

    event.currentTarget.releasePointerCapture?.(event.pointerId);
    pointerRef.current = null;
    setIsDragging(false);
  }

  return (
    <ChatDialog
      isOpen={isOpen}
      className="message-media-viewer"
      titleId="message-media-viewer-title"
      descriptionId="message-media-viewer-description"
      initialFocusRef={closeButtonRef}
      onClose={onClose}
    >
      <header className="message-media-viewer-header">
        <div className="message-media-viewer-heading">
          <ImageIcon size={20} aria-hidden="true" />
          <div>
            <h2 id="message-media-viewer-title">
              {getImageName(activeImage)}
            </h2>
            <p id="message-media-viewer-description">
              {activeIndex >= 0
                ? `${activeIndex + 1} din ${safeImages.length}${
                    hasOlder || hasNewer ? "+" : ""
                  }`
                : "Galeria conversației"}
            </p>
          </div>
        </div>

        <div className="message-media-viewer-toolbar">
          <button
            type="button"
            onClick={() =>
              updateScale((currentScale) => currentScale - SCALE_STEP)
            }
            disabled={scale <= MIN_SCALE}
            aria-label="Micșorează imaginea"
            title="Micșorează (-)"
          >
            <ZoomOut size={20} aria-hidden="true" />
          </button>

          <span className="message-media-viewer-scale">
            {Math.round(scale * 100)}%
          </span>

          <button
            type="button"
            onClick={() =>
              updateScale((currentScale) => currentScale + SCALE_STEP)
            }
            disabled={scale >= MAX_SCALE}
            aria-label="Mărește imaginea"
            title="Mărește (+)"
          >
            <ZoomIn size={20} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={resetView}
            disabled={scale === MIN_SCALE && pan.x === 0 && pan.y === 0}
            aria-label="Resetează zoomul"
            title="Resetează (0)"
          >
            <RotateCcw size={19} aria-hidden="true" />
          </button>

          <button
            ref={closeButtonRef}
            type="button"
            className="message-media-viewer-close"
            onClick={onClose}
            aria-label="Închide galeria"
            title="Închide"
          >
            <X size={23} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div
        ref={stageRef}
        className={`message-media-viewer-stage${
          scale > MIN_SCALE ? " is-zoomed" : ""
        }${isDragging ? " is-dragging" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onDoubleClick={toggleZoom}
      >
        {activeImage ? (
          <img
            key={activeImage.id}
            src={activeImage.url}
            alt={getImageName(activeImage)}
            draggable="false"
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
            }}
          />
        ) : null}

        {isLoading && !activeImage ? (
          <div className="message-media-viewer-state" aria-busy="true">
            <LoaderCircle className="is-spinning" size={30} />
            <span>Se încarcă imaginile...</span>
          </div>
        ) : null}

        {error && !activeImage ? (
          <div className="message-media-viewer-state is-error" role="alert">
            <ImageIcon size={32} aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        {canGoPrevious ? (
          <button
            type="button"
            className="message-media-viewer-navigation is-previous"
            onClick={() => navigate("older")}
            disabled={isNavigating}
            aria-label="Imaginea anterioară"
          >
            <ChevronLeft size={30} aria-hidden="true" />
          </button>
        ) : null}

        {canGoNext ? (
          <button
            type="button"
            className="message-media-viewer-navigation is-next"
            onClick={() => navigate("newer")}
            disabled={isNavigating}
            aria-label="Imaginea următoare"
          >
            <ChevronRight size={30} aria-hidden="true" />
          </button>
        ) : null}

        {isNavigating ? (
          <span className="message-media-viewer-loading-more">
            <LoaderCircle className="is-spinning" size={18} />
          </span>
        ) : null}
      </div>

      {safeImages.length > 1 ? (
        <footer className="message-media-viewer-filmstrip">
          {safeImages.map((image) => (
            <button
              type="button"
              key={image.id}
              className={image.id === activeImageId ? "is-active" : ""}
              onClick={() => onActiveImageChange?.(image.id)}
              aria-label={`Deschide ${getImageName(image)}`}
              aria-current={image.id === activeImageId ? "true" : undefined}
            >
              <img src={image.url} alt="" loading="lazy" />
            </button>
          ))}
        </footer>
      ) : null}
    </ChatDialog>
  );
}
