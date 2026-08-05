"use client";

import "../auth/auth.css";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  Send,
} from "lucide-react";

import FlagBackground from "../components/flagBackground/flagBackground";
import { useToast } from "../components/toast/toastProvider";
import { EMAIL_PATTERN } from "../utils/validation";

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] =
    useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] =
    useState(false);

  const normalizedEmail = email.trim().toLowerCase();
  const isEmailValid =
    normalizedEmail.length <= 254 &&
    EMAIL_PATTERN.test(normalizedEmail);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isEmailValid || isLoading) {
      toast.warning(
        "Introdu o adresă de email validă.",
        "Verifică emailul"
      );
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        "/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(
          data.message ||
            "Solicitarea nu a putut fi trimisă.",
          response.status === 429
            ? "Prea multe solicitări"
            : "Eroare"
        );
        return;
      }

      setSubmittedEmail(normalizedEmail);
      setIsSubmitted(true);

      toast.success(
        "Verifică mesajele primite și folderul Spam.",
        "Solicitare trimisă"
      );
    } catch (error) {
      console.error(
        "Eroare la solicitarea resetării parolei:",
        error
      );

      toast.error(
        "Nu s-a putut realiza conexiunea cu serverul.",
        "Eroare de conexiune"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryAnotherEmail = () => {
    setIsSubmitted(false);
    setSubmittedEmail("");
    setEmail("");
  };

  return (
    <main className="auth-page">
      <FlagBackground />

      <section className="auth-card auth-card-compact">
        {isSubmitted ? (
          <div
            className="auth-result"
            aria-live="polite"
          >
            <span className="auth-result-icon success">
              <CheckCircle2 size={32} />
            </span>

            <div className="auth-header auth-result-header">
              <span className="auth-brand-badge">
                Comunitatea Călătorilor
              </span>

              <h1>Verifică emailul</h1>

              <p>
                Dacă există un cont pentru
                <strong> {submittedEmail}</strong>, vei primi
                un link valabil 30 de minute.
              </p>
            </div>

            <div className="auth-information-box">
              Emailul poate ajunge în câteva minute. Verifică
              și folderele Spam sau Oferte înainte să trimiți
              o nouă solicitare.
            </div>

            <button
              type="button"
              className="auth-secondary-button"
              onClick={handleTryAnotherEmail}
            >
              Folosește altă adresă
            </button>

            <Link
              href="/login"
              className="auth-back-link"
            >
              <ArrowLeft size={17} />
              Înapoi la autentificare
            </Link>
          </div>
        ) : (
          <>
            <div className="auth-header">
              <span className="auth-brand-badge">
                Comunitatea Călătorilor
              </span>

              <span className="auth-feature-icon">
                <Mail size={28} />
              </span>

              <h1>Ai uitat parola?</h1>

              <p>
                Introdu adresa contului tău și îți trimitem
                un link securizat pentru alegerea unei parole
                noi.
              </p>
            </div>

            <form
              className="auth-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="auth-field-group">
                <label htmlFor="forgot-password-email">
                  Adresă de email
                </label>

                <input
                  id="forgot-password-email"
                  type="email"
                  name="email"
                  placeholder="exemplu@email.ro"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                  }}
                  autoComplete="email"
                  maxLength={254}
                  autoFocus
                  className={
                    email.length > 0
                      ? isEmailValid
                        ? "auth-input-valid"
                        : "auth-input-invalid"
                      : ""
                  }
                />

                {email.length > 0 && !isEmailValid && (
                  <p className="auth-validation-message error">
                    Introdu o adresă completă, de forma
                    nume@email.ro.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="auth-submit-button"
                disabled={!isEmailValid || isLoading}
              >
                <Send size={19} />
                {isLoading
                  ? "Se trimite..."
                  : "Trimite linkul de resetare"}
              </button>
            </form>

            <Link
              href="/login"
              className="auth-back-link"
            >
              <ArrowLeft size={17} />
              Înapoi la autentificare
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
