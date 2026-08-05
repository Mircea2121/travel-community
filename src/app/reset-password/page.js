"use client";

import "../auth/auth.css";

import {
  Suspense,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  X,
} from "lucide-react";

import FlagBackground from "../components/flagBackground/flagBackground";
import { useToast } from "../components/toast/toastProvider";
import { getPasswordValidation } from "../utils/validation";

function PasswordRule({ passed, text }) {
  return (
    <span className={passed ? "passed" : ""}>
      {passed ? <Check size={14} /> : <X size={14} />}
      {text}
    </span>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const token = searchParams.get("token")?.trim() || "";

  const [status, setStatus] = useState("checking");
  const [statusMessage, setStatusMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordValidation =
    getPasswordValidation(password);
  const passwordsMatch =
    confirmPassword.length > 0 &&
    password === confirmPassword;
  const isFormValid =
    passwordValidation.isValid && passwordsMatch;

  useEffect(() => {
    const controller = new AbortController();

    async function validateToken() {
      if (!token) {
        setStatusMessage(
          "Linkul de resetare este incomplet sau invalid."
        );
        setStatus("invalid");
        return;
      }

      setStatus("checking");
      setStatusMessage("");

      try {
        const response = await fetch(
          `/api/auth/reset-password?token=${encodeURIComponent(
            token
          )}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const data = await response
          .json()
          .catch(() => ({}));

        if (!response.ok || !data.valid) {
          setStatusMessage(
            data.message ||
              "Linkul este invalid sau a expirat."
          );
          setStatus("invalid");
          return;
        }

        setStatus("ready");
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        console.error(
          "Eroare la verificarea linkului de resetare:",
          error
        );
        setStatusMessage(
          "Linkul nu a putut fi verificat momentan. Reîncearcă."
        );
        setStatus("invalid");
      }
    }

    validateToken();

    return () => {
      controller.abort();
    };
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isFormValid || isLoading || status !== "ready") {
      toast.warning(
        "Respectă toate regulile și confirmă aceeași parolă.",
        "Verifică parola"
      );
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        "/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password,
            confirmPassword,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        if (data.valid === false) {
          setStatusMessage(
            data.message ||
              "Linkul este invalid sau a expirat."
          );
          setStatus("invalid");
        }

        toast.error(
          data.message ||
            "Parola nu a putut fi schimbată.",
          response.status === 429
            ? "Prea multe încercări"
            : "Eroare"
        );
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      setStatus("success");

      toast.success(
        "Te poți autentifica folosind noua parolă.",
        "Parolă schimbată"
      );
    } catch (error) {
      console.error(
        "Eroare la schimbarea parolei:",
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

  if (status === "checking") {
    return (
      <section className="auth-card auth-card-compact">
        <div
          className="auth-loading-state"
          aria-live="polite"
        >
          <span className="auth-loading-spinner" />
          <h1>Verificăm linkul</h1>
          <p>
            Confirmăm că solicitarea este încă valabilă.
          </p>
        </div>
      </section>
    );
  }

  if (status === "invalid") {
    return (
      <section className="auth-card auth-card-compact">
        <div className="auth-result" aria-live="polite">
          <span className="auth-result-icon error">
            <X size={32} />
          </span>

          <div className="auth-header auth-result-header">
            <span className="auth-brand-badge">
              Comunitatea Călătorilor
            </span>
            <h1>Link indisponibil</h1>
            <p>{statusMessage}</p>
          </div>

          <Link
            href="/forgot-password"
            className="auth-submit-button auth-button-link"
          >
            Solicită un link nou
          </Link>

          <Link href="/login" className="auth-back-link">
            <ArrowLeft size={17} />
            Înapoi la autentificare
          </Link>
        </div>
      </section>
    );
  }

  if (status === "success") {
    return (
      <section className="auth-card auth-card-compact">
        <div className="auth-result" aria-live="polite">
          <span className="auth-result-icon success">
            <CheckCircle2 size={32} />
          </span>

          <div className="auth-header auth-result-header">
            <span className="auth-brand-badge">
              Comunitatea Călătorilor
            </span>
            <h1>Parola a fost schimbată</h1>
            <p>
              Toate sesiunile vechi au fost închise. Intră în
              cont folosind parola nouă.
            </p>
          </div>

          <Link
            href="/login"
            className="auth-submit-button auth-button-link"
          >
            Autentifică-te
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-card auth-card-compact">
      <div className="auth-header">
        <span className="auth-brand-badge">
          Comunitatea Călătorilor
        </span>

        <span className="auth-feature-icon">
          <KeyRound size={28} />
        </span>

        <h1>Alege o parolă nouă</h1>

        <p>
          Folosește o parolă sigură, diferită de cea pe care
          ai avut-o până acum.
        </p>
      </div>

      <form
        className="auth-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="auth-field-group">
          <label htmlFor="reset-password">
            Parolă nouă
          </label>

          <div className="auth-password-field">
            <input
              id="reset-password"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Introdu parola nouă"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
              }}
              autoComplete="new-password"
              maxLength={64}
              autoFocus
              className={
                password.length > 0
                  ? passwordValidation.isValid
                    ? "auth-input-valid"
                    : "auth-input-invalid"
                  : ""
              }
            />

            {password.length > 0 && (
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => {
                  setShowPassword((value) => !value);
                }}
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

          {password.length > 0 && (
            <div className="auth-password-security">
              <div className="auth-password-rules">
                <PasswordRule
                  passed={
                    passwordValidation.rules.minimumLength
                  }
                  text="Minimum 8 caractere"
                />
                <PasswordRule
                  passed={
                    passwordValidation.rules.maximumLength &&
                    passwordValidation.rules.maximumBytes
                  }
                  text="Maximum 64 caractere"
                />
                <PasswordRule
                  passed={passwordValidation.rules.uppercase}
                  text="O literă mare"
                />
                <PasswordRule
                  passed={passwordValidation.rules.lowercase}
                  text="O literă mică"
                />
                <PasswordRule
                  passed={passwordValidation.rules.number}
                  text="Cel puțin o cifră"
                />
                <PasswordRule
                  passed={passwordValidation.rules.atSymbol}
                  text="Caracterul @"
                />
              </div>
            </div>
          )}
        </div>

        <div className="auth-field-group">
          <label htmlFor="reset-confirm-password">
            Confirmă parola nouă
          </label>

          <div className="auth-password-field">
            <input
              id="reset-confirm-password"
              type={
                showConfirmPassword ? "text" : "password"
              }
              name="confirmPassword"
              placeholder="Introdu parola din nou"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
              }}
              autoComplete="new-password"
              maxLength={64}
              className={
                confirmPassword.length > 0
                  ? passwordsMatch
                    ? "auth-input-valid"
                    : "auth-input-invalid"
                  : ""
              }
            />

            {confirmPassword.length > 0 && (
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => {
                  setShowConfirmPassword((value) => !value);
                }}
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

          {confirmPassword.length > 0 && (
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

        <button
          type="submit"
          className="auth-submit-button"
          disabled={!isFormValid || isLoading}
        >
          <LockKeyhole size={19} />
          {isLoading
            ? "Se salvează..."
            : "Salvează parola nouă"}
        </button>
      </form>
    </section>
  );
}

function ResetPasswordFallback() {
  return (
    <section className="auth-card auth-card-compact">
      <div className="auth-loading-state" aria-live="polite">
        <span className="auth-loading-spinner" />
        <h1>Pregătim pagina</h1>
        <p>Linkul securizat este în curs de verificare.</p>
      </div>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="auth-page">
      <FlagBackground />

      <Suspense fallback={<ResetPasswordFallback />}>
        <ResetPasswordContent />
      </Suspense>
    </main>
  );
}
