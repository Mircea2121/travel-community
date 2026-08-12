"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  Check,
  Flag,
  X,
} from "lucide-react";

import {
  REPORT_MAX_DETAILS_LENGTH,
  REPORT_REASONS,
  isReportTargetType,
  isUrgentReportReason,
} from "@/app/utils/reportConfig";

import ChatDialog from "./chatDialog";

const TARGET_TITLES = Object.freeze({
  post: "Raportează postarea",
  comment: "Raportează comentariul",
  conversation: "Raportează conversația",
  message: "Raportează mesajul",
  user: "Raportează utilizatorul",
});

export default function ReportDialog({
  isOpen = false,
  targetType = "user",
  targetId = "",
  targetLabel = "acest conținut",
  onReported,
  onClose,
}) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firstReasonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const resetTimer = window.setTimeout(() => {
      setReason("");
      setDetails("");
      setError("");
      setSuccessMessage("");
      setIsSubmitting(false);
    }, 0);

    return () => window.clearTimeout(resetTimer);
  }, [isOpen, targetId, targetType]);

  const normalizedDetails = details.trim();
  const isValid =
    Boolean(reason) &&
    (reason !== "other" || Boolean(normalizedDetails)) &&
    details.length <= REPORT_MAX_DETAILS_LENGTH;
  const title = TARGET_TITLES[targetType] || "Raportează conținutul";

  function handleClose() {
    if (!isSubmitting) {
      onClose?.();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      isSubmitting ||
      !isValid ||
      !isReportTargetType(targetType) ||
      !targetId
    ) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          details: normalizedDetails,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Raportul nu a putut fi trimis."
        );
      }

      const message =
        data?.message || "Raportul a fost trimis echipei de suport.";

      setSuccessMessage(message);
      onReported?.(data?.report || null);
    } catch (submitError) {
      setError(
        submitError?.message || "Raportul nu a putut fi trimis."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ChatDialog
      isOpen={isOpen}
      className="chat-report-dialog"
      titleId="chat-report-dialog-title"
      descriptionId="chat-report-dialog-description"
      preventClose={isSubmitting}
      initialFocusRef={firstReasonRef}
      onClose={handleClose}
    >
      <header className="chat-dialog-header">
        <div className="chat-dialog-heading">
          <span className="chat-dialog-icon chat-dialog-icon-warning">
            <Flag size={20} aria-hidden="true" />
          </span>

          <div>
            <h2 id="chat-report-dialog-title">{title}</h2>
            <p id="chat-report-dialog-description">
              Raportezi <strong>{targetLabel}</strong>. Echipa de moderare va
              verifica situația.
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
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <form className="chat-dialog-form" onSubmit={handleSubmit}>
        <fieldset
          className="chat-report-reasons"
          disabled={isSubmitting || Boolean(successMessage)}
        >
          <legend>Selectează motivul</legend>

          {REPORT_REASONS.map((reportReason, index) => {
            const isSelected = reason === reportReason.value;

            return (
              <label
                key={reportReason.value}
                className={`chat-report-reason${
                  isSelected ? " is-selected" : ""
                }`}
              >
                <input
                  ref={index === 0 ? firstReasonRef : undefined}
                  type="radio"
                  name="reportReason"
                  value={reportReason.value}
                  checked={isSelected}
                  onChange={(event) => {
                    setReason(event.target.value);
                    setError("");
                  }}
                />

                <span className="chat-report-radio" aria-hidden="true">
                  {isSelected ? <Check size={13} /> : null}
                </span>

                <span>{reportReason.label}</span>
              </label>
            );
          })}
        </fieldset>

        {isUrgentReportReason(reason) ? (
          <div className="chat-dialog-message chat-dialog-message-urgent" role="note">
            <AlertTriangle size={18} aria-hidden="true" />
            <span><strong>Situație urgentă?</strong> Dacă există un pericol imediat, contactează serviciile de urgență la 112. Raportul trimis aici va fi analizat separat de echipa platformei.</span>
          </div>
        ) : null}

        <div className="chat-report-details">
          <label htmlFor="chat-report-details">
            Detalii suplimentare
            <span>{reason === "other" ? " obligatorii" : " opționale"}</span>
          </label>

          <textarea
            id="chat-report-details"
            value={details}
            onChange={(event) => {
              setDetails(event.target.value);
              setError("");
            }}
            placeholder="Descrie pe scurt ce s-a întâmplat..."
            maxLength={REPORT_MAX_DETAILS_LENGTH}
            rows={4}
            disabled={isSubmitting || Boolean(successMessage)}
          />

          <div className="chat-report-details-footer">
            <span>Nu include date personale sensibile.</span>
            <span>
              {details.length}/{REPORT_MAX_DETAILS_LENGTH}
            </span>
          </div>
        </div>

        {error ? (
          <div
            className="chat-dialog-message chat-dialog-message-error"
            role="alert"
          >
            <AlertTriangle size={18} aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        {successMessage ? (
          <div
            className="chat-dialog-message chat-dialog-message-success"
            role="status"
          >
            <Check size={18} aria-hidden="true" />
            <span>{successMessage}</span>
          </div>
        ) : null}

        <footer className="chat-dialog-actions">
          <button
            type="button"
            className="chat-dialog-secondary-button"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {successMessage ? "Închide" : "Anulează"}
          </button>

          {!successMessage ? (
            <button
              type="submit"
              className="chat-dialog-danger-button"
              disabled={isSubmitting || !isValid}
            >
              <Flag size={17} aria-hidden="true" />
              <span>
                {isSubmitting ? "Se trimite..." : "Trimite raportul"}
              </span>
            </button>
          ) : null}
        </footer>
      </form>
    </ChatDialog>
  );
}
