"use client";

import "../auth/auth.css";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() || "";
  const requestedTokenRef = useRef(null);
  const [result, setResult] = useState(null);
  const status = token ? result?.status || "loading" : "error";
  const message = token
    ? result?.message || "Verificăm adresa de email..."
    : "Linkul de verificare nu conține un token valid.";

  useEffect(() => {
    if (!token) {
      return;
    }

    if (requestedTokenRef.current === token) {
      return;
    }

    requestedTokenRef.current = token;
    const controller = new AbortController();

    async function verify() {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          setResult({
            status: "error",
            message: data.message || "Linkul nu a putut fi verificat.",
          });
          return;
        }

        setResult({
          status: "success",
          message: "Adresa de email a fost confirmată cu succes.",
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          setResult({
            status: "error",
            message: "Serverul nu a putut procesa verificarea.",
          });
        }
      }
    }

    verify();
    return () => controller.abort();
  }, [token]);

  return (
    <main className="auth-page">
      <section className="auth-card auth-card-compact">
        <div className="auth-header">
          {status === "loading" && (
            <LoaderCircle size={48} className="auth-spin" aria-hidden="true" />
          )}
          {status === "success" && (
            <CheckCircle2 size={48} aria-hidden="true" />
          )}
          {status === "error" && <XCircle size={48} aria-hidden="true" />}
          <h1>Confirmarea emailului</h1>
          <p role="status">{message}</p>
        </div>

        {status !== "loading" && (
          <Link href="/login" className="auth-submit-button">
            Mergi la autentificare
          </Link>
        )}
      </section>
    </main>
  );
}
