"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Bookmark,
  Check,
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react";

import "./postActions.css";

export default function PostActions({
  isLiked = false,
  likesCount = 0,
  commentsCount = 0,

  isLikeLoading = false,
  isSaved = false,
  isSaveLoading = false,

  onLike,
  onSave,
}) {
  const [isLinkCopied, setIsLinkCopied] =
    useState(false);

  useEffect(() => {
    if (!isLinkCopied) {
      return undefined;
    }

    const timeoutId = window.setTimeout(
      () => {
        setIsLinkCopied(false);
      },
      2200
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isLinkCopied]);

  async function copyCurrentLink() {
    const currentUrl =
      window.location.href;

    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(
        currentUrl
      );

      return;
    }

    const temporaryInput =
      document.createElement("textarea");

    temporaryInput.value =
      currentUrl;

    temporaryInput.setAttribute(
      "readonly",
      ""
    );

    temporaryInput.style.position =
      "fixed";

    temporaryInput.style.top =
      "-9999px";

    temporaryInput.style.opacity =
      "0";

    document.body.appendChild(
      temporaryInput
    );

    temporaryInput.select();

    const wasCopied =
      document.execCommand("copy");

    document.body.removeChild(
      temporaryInput
    );

    if (!wasCopied) {
      throw new Error(
        "Linkul nu a putut fi copiat."
      );
    }
  }

  async function handleShare() {
    const shareData = {
      title:
        document.title ||
        "Comunitatea Călătorilor",

      text:
        "Vezi această experiență pe Comunitatea Călătorilor.",

      url: window.location.href,
    };

    try {
      if (
        typeof navigator.share ===
        "function"
      ) {
        await navigator.share(
          shareData
        );

        return;
      }

      await copyCurrentLink();

      setIsLinkCopied(true);
    } catch (shareError) {
      if (
        shareError?.name ===
        "AbortError"
      ) {
        return;
      }

      console.error(
        "Eroare la distribuirea postării:",
        shareError
      );

      try {
        await copyCurrentLink();

        setIsLinkCopied(true);
      } catch (copyError) {
        console.error(
          "Eroare la copierea linkului:",
          copyError
        );

        window.alert(
          "Linkul nu a putut fi distribuit sau copiat."
        );
      }
    }
  }

  const normalizedLikesCount =
    Number.isFinite(
      Number(likesCount)
    )
      ? Number(likesCount)
      : 0;

  const normalizedCommentsCount =
    Number.isFinite(
      Number(commentsCount)
    )
      ? Number(commentsCount)
      : 0;

  return (
    <div className="post-social-actions">
      <button
        type="button"
        className={
          isLiked
            ? "post-action-button post-action-like active"
            : "post-action-button post-action-like"
        }
        onClick={onLike}
        disabled={
          isLikeLoading
        }
        aria-pressed={isLiked}
        aria-label={
          isLiked
            ? "Elimină aprecierea"
            : "Apreciază postarea"
        }
      >
        <Heart
          size={21}
          strokeWidth={2.2}
          fill={
            isLiked
              ? "currentColor"
              : "none"
          }
        />

        <span>
          {isLikeLoading
            ? "Se actualizează..."
            : isLiked
              ? "Apreciat"
              : "Apreciază"}
        </span>

        <strong>
          {normalizedLikesCount}
        </strong>
      </button>

      <button
        type="button"
        className={
          isSaved
            ? "post-action-button post-action-save active"
            : "post-action-button post-action-save"
        }
        onClick={onSave}
        disabled={
          isSaveLoading
        }
        aria-pressed={isSaved}
        aria-label={
          isSaved
            ? "Elimină postarea din salvate"
            : "Salvează postarea"
        }
      >
        <Bookmark
          size={21}
          strokeWidth={2.2}
          fill={
            isSaved
              ? "currentColor"
              : "none"
          }
        />

        <span>
          {isSaveLoading
            ? "Se actualizează..."
            : isSaved
              ? "Salvată"
              : "Salvează"}
        </span>
      </button>

      <button
        type="button"
        className={
          isLinkCopied
            ? "post-action-button post-action-share copied"
            : "post-action-button post-action-share"
        }
        onClick={handleShare}
        aria-label="Distribuie postarea"
      >
        {isLinkCopied ? (
          <Check
            size={21}
            strokeWidth={2.3}
          />
        ) : (
          <Share2
            size={21}
            strokeWidth={2.2}
          />
        )}

        <span>
          {isLinkCopied
            ? "Link copiat"
            : "Distribuie"}
        </span>
      </button>

      <span className="post-comments-count">
        <MessageCircle
          size={18}
          strokeWidth={2.2}
        />

        {normalizedCommentsCount}{" "}
        {normalizedCommentsCount === 1
          ? "comentariu"
          : "comentarii"}
      </span>
    </div>
  );
}