"use client";

import "../auth/auth.css";
import "../auth/production-security.css";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, LogIn } from "lucide-react";

import FlagBackground from "../components/flagBackground/flagBackground";
import TurnstileWidget from "../components/security/turnstileWidget";
import { useToast } from "../components/toast/toastProvider";
import { EMAIL_PATTERN } from "../utils/validation";

export default function LoginPage() {
  const toast = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const handleTurnstileToken = useCallback((token) => {
    setTurnstileToken(token);
  }, []);

  const normalizedEmail = formData.email.trim().toLowerCase();
  const isEmailValid =
    normalizedEmail.length <= 254 && EMAIL_PATTERN.test(normalizedEmail);
  const isPasswordValid =
    formData.password.length > 0 && formData.password.length <= 256;
  const turnstileConfigured = Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  );
  const securityIsValid =
    !turnstileConfigured || Boolean(turnstileToken);
  const isFormValid =
    isEmailValid && isPasswordValid && securityIsValid;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const resetSecurityCheck = () => {
    setTurnstileToken("");
    setTurnstileResetKey((value) => value + 1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isFormValid || isLoading) {
      toast.warning(
        "Completează corect datele și verificarea de securitate.",
        "Verifică formularul"
      );
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password: formData.password,
          turnstileToken,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        resetSecurityCheck();
        toast.error(
          data.message || "Autentificarea a eșuat.",
          response.status === 429 ? "Prea multe încercări" : "Eroare"
        );
        return;
      }

      toast.success(
        "Te-ai autentificat cu succes!",
        "Autentificare reușită"
      );

      setFormData({ email: "", password: "" });

      window.setTimeout(() => {
        sessionStorage.removeItem("travel-community-loader-shown");
        window.location.href = "/profile";
      }, 700);
    } catch (error) {
      console.error("Eroare la conectarea cu serverul:", error);
      resetSecurityCheck();
      toast.error(
        "Nu s-a putut realiza conexiunea cu serverul.",
        "Eroare"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <FlagBackground />

      <section className="auth-card auth-card-compact">
        <div className="auth-header">
          <span className="auth-brand-badge">
            🌍 Comunitatea Călătorilor
          </span>
          <h1>Autentificare</h1>
          <p>
            Conectează-te pentru a publica experiențe și recomandări.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field-group">
            <label htmlFor="login-email">Adresă de email</label>
            <input
              id="login-email"
              type="email"
              name="email"
              placeholder="exemplu@email.ro"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              maxLength={254}
              className={
                formData.email.length > 0
                  ? isEmailValid
                    ? "auth-input-valid"
                    : "auth-input-invalid"
                  : ""
              }
            />
            {formData.email.length > 0 && !isEmailValid && (
              <p className="auth-validation-message error">
                Introdu o adresă completă, de forma nume@email.ro.
              </p>
            )}
          </div>

          <div className="auth-field-group">
            <div className="auth-label-row">
              <label htmlFor="login-password">Parolă</label>
              <Link href="/forgot-password">Ai uitat parola?</Link>
            </div>

            <div className="auth-password-field">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Introdu parola"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                maxLength={256}
              />
              {formData.password.length > 0 && (
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword ? "Ascunde parola" : "Afișează parola"
                  }
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              )}
            </div>
          </div>

          <TurnstileWidget
            action="login"
            onTokenChange={handleTurnstileToken}
            resetKey={turnstileResetKey}
          />

          <button
            type="submit"
            className="auth-submit-button"
            disabled={!isFormValid || isLoading}
          >
            <LogIn size={19} />
            {isLoading ? "Se autentifică..." : "Autentifică-te"}
          </button>
        </form>

        <p className="auth-switch">
          Nu ai cont? <Link href="/register">Creează unul</Link>
        </p>
        <p className="auth-switch">
          Nu ai primit confirmarea?{" "}
          <Link href="/resend-verification">Retrimite emailul</Link>
        </p>
      </section>
    </main>
  );
}
