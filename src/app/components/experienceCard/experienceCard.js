"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  Heart,
  MapPin,
  MessageCircle,
} from "lucide-react";

import getUserInitials from "../../utils/getUserInitials";
import "./experienceCard.css";

const CATEGORY_LABELS = {
  plaja: "Plajă",
  "city-break": "City break",
  munte: "Munte",
  mancare: "Mâncare",
  aventura: "Aventură",
  cultura: "Cultură",
  familie: "Familie",
  "buget-redus": "Buget redus",
};

const NUMBER_FORMATTER = new Intl.NumberFormat("ro-RO", {
  maximumFractionDigits: 0,
});

const DATE_FORMATTER = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function getPostId(post) {
  return String(post?._id || post?.id || "");
}

function getImageUrl(post) {
  const firstImage = Array.isArray(post?.images)
    ? post.images[0]
    : null;

  if (typeof firstImage === "string") {
    return firstImage;
  }

  return typeof firstImage?.url === "string"
    ? firstImage.url
    : "";
}

function getAvatarUrl(avatar) {
  if (typeof avatar === "string") {
    return avatar;
  }

  return typeof avatar?.url === "string" ? avatar.url : "";
}

function getLocation(post) {
  const values = [post?.destination, post?.city, post?.country]
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => value.trim());

  return [...new Set(values.map((value) => value.toLocaleLowerCase("ro-RO")))]
    .map((normalizedValue) =>
      values.find(
        (value) =>
          value.toLocaleLowerCase("ro-RO") === normalizedValue
      )
    )
    .filter(Boolean)
    .join(", ");
}

function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || category || "Călătorie";
}

function formatCost(post) {
  const cost = Number(post?.totalCost);

  if (!Number.isFinite(cost) || cost <= 0) {
    return "";
  }

  const currency =
    typeof post?.currency === "string"
      ? post.currency.toUpperCase()
      : "EUR";

  return currency === "EUR"
    ? `${NUMBER_FORMATTER.format(cost)} €`
    : `${NUMBER_FORMATTER.format(cost)} ${currency}`;
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? ""
    : DATE_FORMATTER.format(date);
}

function getAuthor(post) {
  return {
    name: post?.name || post?.author?.name || "Utilizator",
    username:
      post?.username || post?.author?.username || "",
    avatar: getAvatarUrl(post?.avatar || post?.author?.avatar),
  };
}

export default function ExperienceCard({
  post,
  onToggleLike,
  onToggleSave,
  isLikePending = false,
  isSavePending = false,
  readOnly = false,
  variant = "default",
}) {
  const router = useRouter();
  const postId = getPostId(post);
  const imageUrl = getImageUrl(post);
  const author = getAuthor(post);
  const location = getLocation(post) || "Destinație nespecificată";
  const cost = formatCost(post);
  const publishedAt = formatDate(post?.createdAt);
  const likesCount = Number.isFinite(post?.likesCount)
    ? post.likesCount
    : 0;
  const commentsCount = Number.isFinite(post?.commentsCount)
    ? post.commentsCount
    : 0;
  const savesCount = Number.isFinite(post?.savesCount)
    ? post.savesCount
    : 0;
  const cardVariant =
    variant === "compact" ? "compact" : "default";

  function openPost() {
    if (postId) {
      router.push(`/posts/${postId}`);
    }
  }

  function openProfile() {
    if (author.username) {
      router.push(`/users/${author.username}`);
    }
  }

  return (
    <article
      className={`experience-card experience-card-${cardVariant} ${
        readOnly ? "experience-card-read-only" : ""
      }`}
    >
      <button
        type="button"
        className="experience-card-media"
        onClick={openPost}
        aria-label={`Deschide experiența ${post?.title || "de călătorie"}`}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={location}
            fill
            sizes={
              cardVariant === "compact"
                ? "(max-width: 720px) 100vw, (max-width: 1200px) 50vw, 33vw"
                : "(max-width: 900px) 100vw, 50vw"
            }
            loading="lazy"
          />
        ) : (
          <span className="experience-card-image-fallback">
            Fotografie indisponibilă
          </span>
        )}

        <span className="experience-card-media-overlay" />

        <span className="experience-card-category">
          {getCategoryLabel(post?.category)}
        </span>

        {cost && (
          <span className="experience-card-cost">
            <small>Cost aproximativ</small>
            <strong>{cost}</strong>
          </span>
        )}
      </button>

      <div className="experience-card-body">
        <div className="experience-card-author-row">
          <button
            type="button"
            className="experience-card-author"
            onClick={openProfile}
            disabled={!author.username}
            aria-label={
              author.username
                ? `Deschide profilul ${author.name}`
                : undefined
            }
          >
            <span className="experience-card-avatar">
              {author.avatar ? (
                <Image
                  src={author.avatar}
                  alt=""
                  width={42}
                  height={42}
                  sizes="42px"
                  loading="lazy"
                />
              ) : (
                getUserInitials(author.name)
              )}
            </span>

            <span className="experience-card-author-copy">
              <strong>{author.name}</strong>
              <small>
                {author.username
                  ? `@${author.username}`
                  : "Utilizator șters"}
              </small>
            </span>
          </button>

          {!readOnly && (
            <button
              type="button"
              className={`experience-card-save ${
                post?.isSaved ? "active" : ""
              }`}
              onClick={() => onToggleSave?.(post)}
              disabled={isSavePending || !postId}
              aria-label={
                post?.isSaved
                  ? "Elimină din postările salvate"
                  : "Salvează postarea"
              }
              aria-pressed={Boolean(post?.isSaved)}
            >
              <Bookmark
                size={18}
                strokeWidth={2.2}
                fill={post?.isSaved ? "currentColor" : "none"}
                aria-hidden="true"
              />
            </button>
          )}
        </div>

        <div className="experience-card-meta">
          <span>
            <MapPin size={14} strokeWidth={2.3} aria-hidden="true" />
            {location}
          </span>

          {publishedAt && (
            <span>
              <CalendarDays
                size={14}
                strokeWidth={2.1}
                aria-hidden="true"
              />
              {publishedAt}
            </span>
          )}
        </div>

        <button
          type="button"
          className="experience-card-title"
          onClick={openPost}
        >
          {post?.title || "Experiență de călătorie"}
        </button>

        <p className="experience-card-description">
          {post?.description ||
            "Descoperă experiența și recomandările acestui călător."}
        </p>

        <div className="experience-card-footer">
          <div className="experience-card-actions">
            {readOnly ? (
              <span
                className="experience-card-save-count"
                title={`${likesCount} aprecieri`}
              >
                <Heart
                  size={17}
                  strokeWidth={2.2}
                  aria-hidden="true"
                />
                {likesCount}
              </span>
            ) : (
              <button
                type="button"
                className={post?.isLiked ? "active" : ""}
                onClick={() => onToggleLike?.(post)}
                disabled={isLikePending || !postId}
                aria-label={
                  post?.isLiked
                    ? "Retrage aprecierea"
                    : "Apreciază postarea"
                }
                aria-pressed={Boolean(post?.isLiked)}
              >
                <Heart
                  size={17}
                  strokeWidth={2.2}
                  fill={post?.isLiked ? "currentColor" : "none"}
                  aria-hidden="true"
                />
                <span>{likesCount}</span>
              </button>
            )}

            <button
              type="button"
              onClick={openPost}
              aria-label="Vezi comentariile"
            >
              <MessageCircle
                size={17}
                strokeWidth={2.1}
                aria-hidden="true"
              />
              <span>{commentsCount}</span>
            </button>

            <span
              className="experience-card-save-count"
              title={`${savesCount} salvări`}
            >
              <Bookmark size={16} strokeWidth={2.1} aria-hidden="true" />
              {savesCount}
            </span>
          </div>

          <button
            type="button"
            className="experience-card-open"
            onClick={openPost}
          >
            Citește
            <ArrowUpRight size={17} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

