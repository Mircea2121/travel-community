"use client";

import Script from "next/script";
import { useEffect, useId, useRef } from "react";

const SCRIPT_ID = "cloudflare-turnstile-script";

export default function TurnstileWidget({
  action,
  onTokenChange,
  resetKey = 0,
}) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const generatedId = useId().replaceAll(":", "");
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !window.turnstile || !containerRef.current) {
      return undefined;
    }

    if (widgetIdRef.current !== null) {
      window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action,
      theme: "light",
      size: "flexible",
      callback: (token) => onTokenChange(token),
      "expired-callback": () => onTokenChange(""),
      "error-callback": () => onTokenChange(""),
    });

    return () => {
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [action, generatedId, onTokenChange, resetKey, siteKey]);

  if (!siteKey) {
    return process.env.NODE_ENV === "production" ? (
      <p className="auth-validation-message error" role="alert">
        Verificarea de securitate nu este configurată.
      </p>
    ) : null;
  }

  return (
    <div className="auth-turnstile" aria-label="Verificare de securitate">
      <Script
        id={SCRIPT_ID}
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => {
          if (widgetIdRef.current === null && containerRef.current) {
            widgetIdRef.current = window.turnstile?.render(
              containerRef.current,
              {
              sitekey: siteKey,
              action,
              theme: "light",
              size: "flexible",
              callback: (token) => onTokenChange(token),
              "expired-callback": () => onTokenChange(""),
              "error-callback": () => onTokenChange(""),
              }
            );
          }
        }}
      />
      <div id={`turnstile-${generatedId}`} ref={containerRef} />
    </div>
  );
}
