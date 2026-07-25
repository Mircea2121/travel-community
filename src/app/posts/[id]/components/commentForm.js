import { Send } from "lucide-react";

export default function CommentForm({
  value = "",
  error = "",
  isSubmitting = false,
  isAuthenticated = false,
  onChange,
  onSubmit,
}) {
  if (!isAuthenticated) {
    return (
      <p className="comment-login-message">
        Trebuie să fii autentificat pentru a publica un comentariu.
      </p>
    );
  }

  return (
    <>
      <form
        className="comment-form"
        onSubmit={onSubmit}
      >
        <textarea
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder="Scrie un comentariu..."
          maxLength={1500}
          disabled={isSubmitting}
        />

        <div className="comment-form-footer">
          <span>{value.length}/1500</span>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              !value.trim()
            }
          >
            <Send
              size={17}
              strokeWidth={2.2}
            />

            {isSubmitting
              ? "Se publică..."
              : "Publică"}
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
    </>
  );
}