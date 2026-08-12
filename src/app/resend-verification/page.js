"use client";

import "../auth/auth.css";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";

import { EMAIL_PATTERN } from "../utils/validation";

export default function ResendVerificationPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const normalizedEmail = email.trim().toLowerCase();
  const isValid =
    normalizedEmail.length <= 254 && EMAIL_PATTERN.test(normalizedEmail);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isValid || isLoading) {
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await response.json().catch(() => ({}));
      setMessage(
        data.message ||
          "Dacă adresa aparține unui cont neconfirmat, vei primi un email."
      );
    } catch {
      setMessage("Conexiunea cu serverul nu a putut fi realizată.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card auth-card-compact">
        <div className="auth-header">
          <MailCheck size={48} aria-hidden="true" />
          <h1>Retrimite confirmarea</h1>
          <p>Introdu adresa folosită când ai creat contul.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field-group">
            <label htmlFor="verification-email">Adresă de email</label>
            <input
              id="verification-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              maxLength={254}
              placeholder="exemplu@email.ro"
            />
          </div>

          <button
            type="submit"
            className="auth-submit-button"
            disabled={!isValid || isLoading}
          >
            {isLoading ? "Se trimite..." : "Trimite link nou"}
          </button>
        </form>

        {message && <p className="auth-validation-message">{message}</p>}
        <p className="auth-switch">
          <Link href="/login">Înapoi la autentificare</Link>
        </p>
      </section>
    </main>
  );
}

