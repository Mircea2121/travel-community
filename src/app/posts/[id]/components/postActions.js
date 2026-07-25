import {
  Heart,
  MessageCircle,
} from "lucide-react";

export default function PostActions({
  isLiked = false,
  likesCount = 0,
  commentsCount = 0,
  isLikeLoading = false,
  onLike,
}) {
  return (
    <div className="post-social-actions">
      <button
        type="button"
        className={
          isLiked
            ? "post-like-button active"
            : "post-like-button"
        }
        onClick={onLike}
        disabled={isLikeLoading}
        aria-pressed={isLiked}
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
          {likesCount}
        </strong>
      </button>

      <span className="post-comments-count">
        <MessageCircle
          size={18}
          strokeWidth={2.2}
        />

        {commentsCount}{" "}
        {commentsCount === 1
          ? "comentariu"
          : "comentarii"}
      </span>
    </div>
  );
}