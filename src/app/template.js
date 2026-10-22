"use client";
import { useEffect } from "react";
export default function Template({ children }) {
  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => { window.history.scrollRestoration = previous; };
  }, []);
  // Server-rendered content stays visible throughout hydration.
  return children;
}
