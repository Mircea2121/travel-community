"use client";

import "../auth/auth.css";

import { useState } from "react";
import Link from "next/link";
import { Check, Eye, EyeOff, ShieldCheck, X, } from "lucide-react";

import FlagBackground from "../components/flagBackground/flagBackground";
import { useToast } from "../components/toast/toastProvider";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function RegisterPage() {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [securityChecked, setSecurityChecked] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const passwordRules = {
    minimumLength: formData.password.length >= 8,
    lowercase: /[a-z]/.test(formData.password),
    uppercase: /[A-Z]/.test(formData.password),
    number: /\d/.test(formData.password),
    atSymbol: formData.password.includes("@"),
  };

  const passedPasswordRules =
    Object.values(passwordRules).filter(Boolean).length;

  const isNameValid = formData.name.trim().length >= 2;

  const isEmailValid = EMAIL_PATTERN.test(
    formData.email.trim()
  );

  const isPasswordValid =
    passwordRules.minimumLength &&
    passwordRules.lowercase &&
    passwordRules.uppercase &&
    passwordRules.number &&
    passwordRules.atSymbol;

  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;

  const isFormValid =
    isNameValid &&
    isEmailValid &&
    isPasswordValid &&
    passwordsMatch &&
    acceptedTerms &&
    securityChecked;

  let passwordStrengthClass = "weak";
  let passwordStrengthText = "Parolă slabă";

  if (passedPasswordRules >= 5) {
    passwordStrengthClass = "strong";
    passwordStrengthText = "Parolă puternică";
  } else if (passedPasswordRules >= 3) {
    passwordStrengthClass = "medium";
    passwordStrengthText = "Parolă medie";
  }

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setSubmitted(false);
  };

  const handleSubmit = async (event) => {
  event.preventDefault();

    if (!isFormValid) {
      toast.warning(
        "Completează toate câmpurile și acceptă termenii și condițiile.",
        "Formular incomplet"
      );

      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(
          data.message,
          "Eroare"
        );

        return;
      }

      setSubmitted(true);

      toast.success(
        "Contul a fost creat cu succes!",
        "Succes"
      );

      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      setAcceptedTerms(false);
      setSecurityChecked(false);

    } catch (error) {
      console.error(error);

      toast.error(
        "A apărut o eroare la conectarea cu serverul.",
        "Eroare"
      );
    }
  };

  return (
    <main className="auth-page">
      <FlagBackground />

      <section className="auth-card">
        <div className="auth-header">
          <span className="auth-brand-badge">
            🌍 Travel Community
          </span>

          <h1>Creează cont</h1>

          <p>
            Intră în comunitate și postează experiențele tale
            de călătorie.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="auth-field-group">
            <label htmlFor="register-name">
              Numele tău
            </label>

            <input
              id="register-name"
              type="text"
              name="name"
              placeholder="Exemplu: Mircea Chiriță"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              className={
                formData.name.length > 0
                  ? isNameValid
                    ? "auth-input-valid"
                    : "auth-input-invalid"
                  : ""
              }
            />

            {formData.name.length > 0 && !isNameValid && (
              <p className="auth-validation-message error">
                <X size={15} />
                Introdu minimum două caractere.
              </p>
            )}
          </div>

          <div className="auth-field-group">
            <label htmlFor="register-email">
              Adresă de email
            </label>

            <input
              id="register-email"
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

            {formData.email.length > 0 && (
              <p
                className={`auth-validation-message ${
                  isEmailValid ? "success" : "error"
                }`}
              >
                {isEmailValid ? (
                  <Check size={15} />
                ) : (
                  <X size={15} />
                )}

                {isEmailValid
                  ? "Adresa de email este validă."
                  : "Introdu o adresă completă, de forma nume@email.ro."}
              </p>
            )}
          </div>

          <div className="auth-field-group">
            <label htmlFor="register-password">
              Parolă
            </label>

            <div className="auth-password-field">
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Creează o parolă sigură"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
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

            {formData.password.length > 0 && (
              <div className="auth-password-security">
                <div className="auth-strength-header">
                  <span>Siguranța parolei</span>

                  <strong className={passwordStrengthClass}>
                    {passwordStrengthText}
                  </strong>
                </div>

                <div
                  className={`auth-strength-bar ${passwordStrengthClass}`}
                >
                  <span />
                </div>

                <div className="auth-password-rules">
                  <PasswordRule
                    passed={passwordRules.minimumLength}
                    text="Minimum 8 caractere"
                  />

                  <PasswordRule
                    passed={passwordRules.uppercase}
                    text="O literă mare"
                  />

                  <PasswordRule
                    passed={passwordRules.lowercase}
                    text="O literă mică"
                  />

                  <PasswordRule
                    passed={passwordRules.number}
                    text="Cel puțin o cifră"
                  />

                  <PasswordRule
                    passed={passwordRules.atSymbol}
                    text="Caracterul @"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="auth-field-group">
            <label htmlFor="register-confirm-password">
              Confirmă parola
            </label>

            <div className="auth-password-field">
              <input
                id="register-confirm-password"
                type={
                  showConfirmPassword ? "text" : "password"
                }
                name="confirmPassword"
                placeholder="Introdu parola din nou"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                className={
                  formData.confirmPassword.length > 0
                    ? passwordsMatch
                      ? "auth-input-valid"
                      : "auth-input-invalid"
                    : ""
                }
              />

              {formData.confirmPassword.length > 0 && (
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      (previousValue) => !previousValue
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Ascunde parola"
                      : "Afișează parola"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              )}
            </div>

            {formData.confirmPassword.length > 0 && (
              <p
                className={`auth-validation-message ${
                  passwordsMatch ? "success" : "error"
                }`}
              >
                {passwordsMatch ? (
                  <Check size={15} />
                ) : (
                  <X size={15} />
                )}

                {passwordsMatch
                  ? "Parolele coincid."
                  : "Parolele nu coincid."}
              </p>
            )}
          </div>

          <label className="auth-checkbox-row">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) =>
                setAcceptedTerms(event.target.checked)
              }
            />

            <span className="auth-custom-checkbox">
              <Check size={14} />
            </span>

            <span>
              Sunt de acord cu{" "}
              <Link href="/terms">
                Termenii și condițiile
              </Link>{" "}
              și cu{" "}
              <Link href="/privacy">
                Politica de confidențialitate
              </Link>
              .
            </span>
          </label>

          <label className="auth-security-check">
            <input
              type="checkbox"
              checked={securityChecked}
              onChange={(event) =>
                setSecurityChecked(event.target.checked)
              }
            />

            <span className="auth-security-checkbox">
              <Check size={17} />
            </span>

            <span className="auth-security-content">
              <strong>Nu sunt robot</strong>
              <small>Verificare de securitate</small>
            </span>

            <ShieldCheck
              className="auth-security-icon"
              size={30}
            />
          </label>

          <button
            type="submit"
            className="auth-submit-button"
            disabled={!isFormValid}
          >
            Creează cont
          </button>

        </form>

        <p className="auth-switch">
          Ai deja cont?{" "}
          <Link href="/login">
            Autentifică-te
          </Link>
        </p>
      </section>
    </main>
  );
}

function PasswordRule({ passed, text }) {
  return (
    <span className={passed ? "passed" : ""}>
      {passed ? (
        <Check size={14} />
      ) : (
        <X size={14} />
      )}

      {text}
    </span>
  );
}