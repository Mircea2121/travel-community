"use client";

import "../auth/auth.css";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

import FlagBackground from "../components/flagBackground/flagBackground";
import { useToast } from "../components/toast/toastProvider";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function LoginPage() {
  const toast = useToast();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const isEmailValid = EMAIL_PATTERN.test(formData.email.trim());
  const isPasswordValid = formData.password.length > 0;

  const isFormValid = isEmailValid && isPasswordValid;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!isFormValid) {
      toast.warning(
        "Completează corect adresa de email și parola.",
        "Verifică formularul"
      );

      return;
    }

    console.log("Autentificare pregătită pentru backend:", {
      email: formData.email.trim(),
      password: formData.password,
    });

    toast.info(
      "Autentificarea este pregătită pentru conectarea la baza de date.",
      "Funcționalitate în pregătire"
    );
  };

  return (
    <main className="auth-page">
      <FlagBackground />

      <section className="auth-card">
        <div className="auth-header">
          <span className="auth-brand-badge">
            🌍 Comunitatea Călătorilor
          </span>

          <h1>Autentificare</h1>

          <p>
            Conectează-te pentru a posta experiențe, fotografii și recenzii.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="auth-field-group">
            <label htmlFor="login-email">
              Adresă de email
            </label>

            <input
              id="login-email"
              type="email"
              name="email"
              placeholder="exemplu@email.ro"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
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
            <label htmlFor="login-password">
              Parolă
            </label>

            <div className="auth-password-field">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Introdu parola"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
              />

              {formData.password.length > 0 && (
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previousValue) => !previousValue
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Ascunde parola"
                      : "Afișează parola"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-button"
            disabled={!isFormValid}
          >
            Autentifică-te
          </button>
        </form>

        <p className="auth-switch">
          Nu ai cont?{" "}
          <Link href="/register">
            Creează unul
          </Link>
        </p>
      </section>
    </main>
  );
}