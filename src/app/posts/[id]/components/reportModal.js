"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  createPortal,
} from "react-dom";

import {
  AlertTriangle,
  Check,
  Flag,
  X,
} from "lucide-react";

import "./reportModal.css";

const REPORT_REASONS = [
  {
    value: "spam",
    label: "Spam sau promovare",
  },
  {
    value: "offensive_language",
    label: "Limbaj ofensator",
  },
  {
    value: "harassment",
    label:
      "Hărțuire sau atac la persoană",
  },
  {
    value: "sexual_content",
    label: "Conținut sexual",
  },
  {
    value: "violence",
    label:
      "Violență sau amenințări",
  },
  {
    value: "false_information",
    label: "Informații false",
  },
  {
    value: "fraud",
    label:
      "Înșelătorie sau fraudă",
  },
  {
    value: "other",
    label: "Alt motiv",
  },
];

export default function ReportModal({
  isOpen = false,
  targetLabel = "conținut",
  selectedReason = "",
  details = "",
  error = "",
  successMessage = "",
  isSubmitting = false,
  onReasonChange,
  onDetailsChange,
  onSubmit,
  onClose,
}) {
  const [
    isMounted,
    setIsMounted,
  ] = useState(false);

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
      return undefined;
    }

    function handleKeyDown(event) {
      if (
        event.key === "Escape" &&
        !isSubmitting
      ) {
        onClose();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    const previousBodyOverflow =
      document.body.style.overflow;

    const previousHtmlOverflow =
      document.documentElement.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    document.documentElement.style.overflow =
      "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        previousBodyOverflow;

      document.documentElement.style.overflow =
        previousHtmlOverflow;
    };
  }, [
    isOpen,
    isSubmitting,
    onClose,
  ]);

  if (
    !isMounted ||
    !isOpen
  ) {
    return null;
  }

  function handleOverlayMouseDown(
    event
  ) {
    if (
      event.target ===
        event.currentTarget &&
      !isSubmitting
    ) {
      onClose();
    }
  }

  function handleFormSubmit(event) {
    event.preventDefault();

    if (
      typeof onSubmit ===
      "function"
    ) {
      onSubmit(event);
    }
  }

  const modalContent = (
    <div
      className="report-modal-overlay"
      role="presentation"
      onMouseDown={
        handleOverlayMouseDown
      }
    >
      <section
        className="report-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        aria-describedby="report-modal-description"
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        <button
          type="button"
          className="report-modal-close"
          aria-label="Închide raportarea"
          disabled={isSubmitting}
          onClick={onClose}
        >
          <X
            size={20}
            strokeWidth={2.2}
          />
        </button>

        <div className="report-modal-icon">
          <Flag
            size={30}
            strokeWidth={1.9}
          />
        </div>

        <div className="report-modal-heading">
          <h2 id="report-modal-title">
            Raportează {targetLabel}
          </h2>

          <p id="report-modal-description">
            Selectează motivul pentru
            care consideri că acest
            conținut trebuie verificat.
          </p>
        </div>

        <form
          className="report-modal-form"
          onSubmit={
            handleFormSubmit
          }
        >
          <fieldset
            className="report-reasons"
            disabled={isSubmitting}
          >
            <legend>
              Motivul raportării
            </legend>

            {REPORT_REASONS.map(
              (reason) => {
                const isSelected =
                  selectedReason ===
                  reason.value;

                return (
                  <label
                    key={reason.value}
                    className={`report-reason-option ${
                      isSelected
                        ? "selected"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={
                        reason.value
                      }
                      checked={
                        isSelected
                      }
                      onChange={(
                        event
                      ) => {
                        if (
                          typeof onReasonChange ===
                          "function"
                        ) {
                          onReasonChange(
                            event.target
                              .value
                          );
                        }
                      }}
                    />

                    <span className="report-reason-check">
                      {isSelected && (
                        <Check
                          size={15}
                          strokeWidth={3}
                        />
                      )}
                    </span>

                    <span className="report-reason-label">
                      {reason.label}
                    </span>
                  </label>
                );
              }
            )}
          </fieldset>

          {["harassment", "violence"].includes(selectedReason) && (
            <div className="report-urgent-note" role="note">
              <AlertTriangle size={19} aria-hidden="true" />
              <p><strong>Situație urgentă?</strong> Dacă există un pericol imediat, contactează serviciile de urgență la 112. Raportul trimis aici va fi analizat separat de echipa platformei.</p>
            </div>
          )}

          <div className="report-details-field">
            <label htmlFor="report-details">
              Detalii suplimentare

              <span>
                {selectedReason ===
                "other"
                  ? " obligatorii"
                  : " opționale"}
              </span>
            </label>

            <textarea
              id="report-details"
              value={details}
              maxLength={1000}
              disabled={isSubmitting}
              placeholder={
                selectedReason ===
                "other"
                  ? "Descrie motivul raportării..."
                  : "Poți adăuga mai multe detalii..."
              }
              onChange={(event) => {
                if (
                  typeof onDetailsChange ===
                  "function"
                ) {
                  onDetailsChange(
                    event.target.value
                  );
                }
              }}
            />

            <span className="report-details-counter">
              {details.length}/1000
            </span>
          </div>

          {error && (
            <div
              className="report-modal-message report-modal-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {successMessage && (
            <div
              className="report-modal-message report-modal-success"
              role="status"
            >
              {successMessage}
            </div>
          )}

          <div className="report-modal-actions">
            <button
              type="button"
              className="report-modal-button report-modal-cancel"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Anulează
            </button>

            <button
              type="submit"
              className="report-modal-button report-modal-submit"
              disabled={
                isSubmitting ||
                Boolean(successMessage)
              }
            >
              {isSubmitting ? (
                <>
                  <span className="report-modal-spinner" />

                  Se trimite...
                </>
              ) : (
                <>
                  <Flag
                    size={17}
                    strokeWidth={2.2}
                  />

                  Trimite raportul
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );

  return createPortal(
    modalContent,
    document.body
  );
}
