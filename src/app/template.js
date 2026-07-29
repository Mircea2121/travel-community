"use client";

import { useEffect, useState } from "react";
import "./page-loader.css";

const LOADER_SESSION_KEY = "travel-community-loader-shown";

export default function Template({ children }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const previousScrollRestoration =
      window.history.scrollRestoration;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const loaderWasShown = sessionStorage.getItem(
      LOADER_SESSION_KEY
    );

    if (loaderWasShown) {
      setIsLoading(false);
      setIsReady(true);

      return () => {
        if ("scrollRestoration" in window.history) {
          window.history.scrollRestoration =
            previousScrollRestoration;
        }
      };
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });

    sessionStorage.setItem(
      LOADER_SESSION_KEY,
      "true"
    );

    setIsLoading(true);
    setIsReady(true);

    const loadingTimer = window.setTimeout(() => {
      setIsLoading(false);

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
    }, 1500);

    return () => {
      window.clearTimeout(loadingTimer);

      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration =
          previousScrollRestoration;
      }
    };
  }, []);

  if (!isReady) {
    return (
      <div
        className="page-loader"
        aria-hidden="true"
      />
    );
  }

  return (
    <>
      {isLoading && (
        <div
          className="page-loader"
          role="status"
          aria-live="polite"
          aria-label="Pagina se încarcă"
        >
          <div className="page-loader-content">
            <div className="page-loader-icon">
              <svg
                className="real-hourglass"
                viewBox="0 0 64 64"
                aria-hidden="true"
              >
                <path
                  className="hourglass-frame"
                  d="M18 8h28M18 56h28"
                />

                <path
                  className="hourglass-glass"
                  d="M21 10h22c0 10-4 15-11 22 7 7 11 12 11 22H21c0-10 4-15 11-22-7-7-11-12-11-22Z"
                />

                <path
                  className="hourglass-sand-top"
                  d="M24 14h16c-1 6-4 10-8 14-4-4-7-8-8-14Z"
                />

                <path
                  className="hourglass-sand-bottom"
                  d="M24 50h16c-2-6-5-10-8-13-3 3-6 7-8 13Z"
                />

                <path
                  className="hourglass-sand-stream"
                  d="M32 28v9"
                />

                <circle
                  className="hourglass-sand-drop"
                  cx="32"
                  cy="35"
                  r="1.6"
                />
              </svg>
            </div>

            <span>Explorăm lumea...</span>
          </div>
        </div>
      )}

      <div
        className={
          isLoading
            ? "page-transition page-transition-loading"
            : "page-transition page-transition-visible"
        }
      >
        {children}
      </div>
    </>
  );
}