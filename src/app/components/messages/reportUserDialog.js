"use client";

import {
  AlertTriangle,
  Check,
  Flag,
  X,
} from "lucide-react";

const REPORT_REASONS = [
  {
    value: "spam",
    label: "Spam sau mesaje repetitive",
  },
  {
    value: "harassment",
    label: "Hărțuire sau amenințări",
  },
  {
    value: "offensive_language",
    label: "Limbaj ofensator",
  },
  {
    value: "scam",
    label: "Înșelătorie sau tentativă de fraudă",
  },
  {
    value: "inappropriate_content",
    label: "Conținut nepotrivit",
  },
  {
    value: "other",
    label: "Alt motiv",
  },
];

export default function ReportUserDialog({
  isOpen = false,
  user = null,

  reason = "",
  details = "",
  error = "",
  successMessage = "",

  isSubmitting = false,

  onReasonChange,
  onDetailsChange,
  onSubmit,
  onClose,
}) {
  if (!isOpen) {
    return null;
  }

  const displayName =
    user?.name ||
    user?.fullName ||
    user?.username ||
    "acest utilizator";

  function handleBackdropClick(event) {
    if (
      event.target ===
      event.currentTarget &&
      !isSubmitting
    ) {
      onClose?.();
    }
  }

  function handleReasonChange(event) {
    if (
      typeof onReasonChange ===
      "function"
    ) {
      onReasonChange(
        event.target.value
      );
    }
  }

  function handleDetailsChange(event) {
    if (
      typeof onDetailsChange ===
      "function"
    ) {
      onDetailsChange(
        event.target.value
      );
    }
  }

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    onClose?.();
  }

  return (
    <div
      className="chat-dialog-backdrop"
      role="presentation"
      onMouseDown={
        handleBackdropClick
      }
    >
      <section
        className="chat-dialog chat-report-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-report-dialog-title"
      >
        <header className="chat-dialog-header">
          <div className="chat-dialog-heading">
            <span className="chat-dialog-icon chat-dialog-icon-warning">
              <Flag
                size={21}
                strokeWidth={2.2}
              />
            </span>

            <div>
              <h2 id="chat-report-dialog-title">
                Raportează utilizatorul
              </h2>

              <p>
                Raportezi conversația cu{" "}
                <strong>
                  {displayName}
                </strong>
                .
              </p>
            </div>
          </div>

          <button
            type="button"
            className="chat-dialog-close"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Închide fereastra"
          >
            <X
              size={21}
              strokeWidth={2.2}
            />
          </button>
        </header>

        <form
          className="chat-dialog-form"
          onSubmit={onSubmit}
        >
          <fieldset
            className="chat-report-reasons"
            disabled={isSubmitting}
          >
            <legend>
              Selectează motivul
            </legend>

            {REPORT_REASONS.map(
              (reportReason) => {
                const isSelected =
                  reason ===
                  reportReason.value;

                return (
                  <label
                    key={
                      reportReason.value
                    }
                    className={
                      isSelected
                        ? "chat-report-reason is-selected"
                        : "chat-report-reason"
                    }
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={
                        reportReason.value
                      }
                      checked={
                        isSelected
                      }
                      onChange={
                        handleReasonChange
                      }
                    />

                    <span className="chat-report-radio">
                      {isSelected && (
                        <Check
                          size={14}
                          strokeWidth={3}
                        />
                      )}
                    </span>

                    <span>
                      {
                        reportReason.label
                      }
                    </span>
                  </label>
                );
              }
            )}
          </fieldset>

          <div className="chat-report-details">
            <label htmlFor="chat-report-details">
              Detalii suplimentare
              <span>
                {reason === "other"
                  ? " obligatoriu"
                  : " opțional"}
              </span>
            </label>

            <textarea
              id="chat-report-details"
              value={details}
              onChange={
                handleDetailsChange
              }
              placeholder="Descrie pe scurt ce s-a întâmplat..."
              maxLength={1000}
              disabled={isSubmitting}
            />

            <div className="chat-report-details-footer">
              <span>
                Raportarea va fi trimisă
                administratorilor.
              </span>

              <span>
                {details.length}/1000
              </span>
            </div>
          </div>

          {error && (
            <div
              className="chat-dialog-message chat-dialog-message-error"
              role="alert"
            >
              <AlertTriangle
                size={18}
                strokeWidth={2.2}
              />

              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div
              className="chat-dialog-message chat-dialog-message-success"
              role="status"
            >
              <Check
                size={18}
                strokeWidth={2.3}
              />

              <span>
                {successMessage}
              </span>
            </div>
          )}

          <footer className="chat-dialog-actions">
            <button
              type="button"
              className="chat-dialog-secondary-button"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Anulează
            </button>

            <button
              type="submit"
              className="chat-dialog-danger-button"
              disabled={
                isSubmitting ||
                !reason ||
                (
                  reason === "other" &&
                  !details.trim()
                )
              }
            >
              <Flag
                size={17}
                strokeWidth={2.2}
              />

              <span>
                {isSubmitting
                  ? "Se trimite..."
                  : "Trimite raportul"}
              </span>
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}