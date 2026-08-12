"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { createPortal } from "react-dom";

import Cropper from "react-easy-crop";

import {
  Check,
  Image as ImageIcon,
  LoaderCircle,
  X,
} from "lucide-react";

import { getCroppedImage } from "../../utils/cropImage";

import "./imageCropModal.css";

export default function ImageCropModal({
  isOpen,
  imageSource,
  type = "avatar",
  onClose,
  onSave,
}) {
  const [isMounted, setIsMounted] =
    useState(false);

  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] =
    useState(1);

  const [
    croppedAreaPixels,
    setCroppedAreaPixels,
  ] = useState(null);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const isAvatar =
    type === "avatar";

  const title = isAvatar
    ? "Ajustează fotografia de profil"
    : "Ajustează fotografia de copertă";

  const description = isAvatar
    ? "Mută și mărește imaginea până când fotografia este încadrată corect."
    : "Mută și mărește imaginea pentru a alege zona care va apărea pe copertă.";

  const aspect = isAvatar
    ? 1
    : 16 / 6;

  useEffect(() => {
    const mountTimer = window.setTimeout(() => {
      setIsMounted(true);
    }, 0);

    return () => {
      window.clearTimeout(mountTimer);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const resetTimer = window.setTimeout(() => {
      setCrop({
        x: 0,
        y: 0,
      });
      setZoom(1);
      setCroppedAreaPixels(null);
      setIsSaving(false);
      setError("");
    }, 0);

    return () => window.clearTimeout(resetTimer);
  }, [
    isOpen,
    imageSource,
    type,
  ]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (
        event.key === "Escape" &&
        !isSaving
      ) {
        onClose?.();
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
    isOpen,
    isSaving,
    onClose,
  ]);

  const handleCropComplete =
    useCallback(
      (
        _croppedArea,
        nextCroppedAreaPixels
      ) => {
        setCroppedAreaPixels(
          nextCroppedAreaPixels
        );
      },
      []
    );

  function handleBackdropClick(
    event
  ) {
    if (
      event.target !==
      event.currentTarget
    ) {
      return;
    }

    if (isSaving) {
      return;
    }

    onClose?.();
  }

  function handleCancel() {
    if (isSaving) {
      return;
    }

    onClose?.();
  }

  async function handleSave() {
    if (
      isSaving ||
      !imageSource ||
      !croppedAreaPixels
    ) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const croppedFile =
        await getCroppedImage({
          imageSource,
          croppedAreaPixels,
          type,
        });

      if (
        typeof onSave !==
        "function"
      ) {
        throw new Error(
          "Salvarea imaginii nu este conectată."
        );
      }

      await onSave(croppedFile);
    } catch (saveError) {
      console.error(
        "Eroare la procesarea imaginii:",
        saveError
      );

      setError(
        saveError?.message ||
          "Imaginea nu a putut fi procesată."
      );

      setIsSaving(false);
    }
  }

  if (
    !isMounted ||
    !isOpen ||
    !imageSource
  ) {
    return null;
  }

  return createPortal(
    <div
      className="image-crop-modal-backdrop"
      onMouseDown={
        handleBackdropClick
      }
      role="presentation"
    >
      <section
        className={`image-crop-modal image-crop-modal-${type}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-crop-modal-title"
      >
        <header className="image-crop-modal-header">
          <div>
            <span className="image-crop-modal-kicker">
              <ImageIcon
                size={17}
                strokeWidth={2.2}
                aria-hidden="true"
              />

              Personalizare profil
            </span>

            <h2 id="image-crop-modal-title">
              {title}
            </h2>

            <p>{description}</p>
          </div>

          <button
            type="button"
            className="image-crop-modal-close"
            onClick={
              handleCancel
            }
            disabled={
              isSaving
            }
            aria-label="Închide"
          >
            <X
              size={21}
              strokeWidth={2.2}
              aria-hidden="true"
            />
          </button>
        </header>

        <div
          className={`image-crop-modal-workspace image-crop-modal-workspace-${type}`}
        >
          <Cropper
            image={imageSource}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={
              isAvatar
                ? "round"
                : "rect"
            }
            showGrid={!isAvatar}
            objectFit="horizontal-cover"
            onCropChange={setCrop}
            onCropComplete={
              handleCropComplete
            }
            onZoomChange={setZoom}
            minZoom={0.5}
            maxZoom={3}
            zoomSpeed={0.15}
            restrictPosition={false}
          />
        </div>

        <div className="image-crop-modal-controls">
          <div className="image-crop-modal-zoom-row">
            <label htmlFor="image-crop-zoom">
              Zoom
            </label>

            <input
              id="image-crop-zoom"
              type="range"
              min="0.5"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(event) => {
                setZoom(
                  Number(
                    event.target.value
                  )
                );
              }}
              disabled={
                isSaving
              }
            />

            <span>
              {Math.round(
                zoom * 100
              )}
              %
            </span>
          </div>

          <p className="image-crop-modal-hint">
            Poți muta imaginea cu mouse-ul sau cu degetul.
          </p>

          {error && (
            <p
              className="image-crop-modal-error"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>

        <footer className="image-crop-modal-footer">
          <button
            type="button"
            className="image-crop-modal-cancel"
            onClick={
              handleCancel
            }
            disabled={
              isSaving
            }
          >
            <X
              size={17}
              aria-hidden="true"
            />

            Anulează
          </button>

          <button
            type="button"
            className="image-crop-modal-save"
            onClick={
              handleSave
            }
            disabled={
              isSaving ||
              !croppedAreaPixels
            }
          >
            {isSaving ? (
              <LoaderCircle
                size={18}
                className="image-crop-modal-spinner"
                aria-hidden="true"
              />
            ) : (
              <Check
                size={18}
                aria-hidden="true"
              />
            )}

            {isSaving
              ? "Se salvează..."
              : "Salvează imaginea"}
          </button>
        </footer>
      </section>
    </div>,
    document.body
  );
}
