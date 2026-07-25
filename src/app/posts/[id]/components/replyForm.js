import { Send, X } from "lucide-react";

export default function ReplyForm({
  value = "",
  error = "",
  isSubmitting = false,
  replyingToName = "",
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <div className="reply-form-wrapper">
      <div className="reply-form-header">
        <span>
          Răspunzi lui{" "}
          <strong>
            {replyingToName || "utilizator"}
          </strong>
        </span>

        <button
          type="button"
          className="reply-cancel-button"
          onClick={onCancel}
          disabled={isSubmitting}
          aria-label="Anulează răspunsul"
        >
          <X
            size={17}
            strokeWidth={2.2}
          />
        </button>
      </div>

      <form
        className="reply-form"
        onSubmit={onSubmit}
      >
        <textarea
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder="Scrie un răspuns..."
          maxLength={1500}
          disabled={isSubmitting}
        />

        <div className="reply-form-footer">
          <span>{value.length}/1500</span>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              !value.trim()
            }
          >
            <Send
              size={16}
              strokeWidth={2.2}
            />

            {isSubmitting
              ? "Se publică..."
              : "Răspunde"}
          </button>
        </div>
      </form>

      {error && (
        <div
          className="comment-error"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}