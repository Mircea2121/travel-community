"use client";

import Link from "next/link";

export const DISCOVERY_SCROLL_STORAGE_KEY =
  "community-discovery-return-position";

export default function RememberScrollLink({ href, children, ...props }) {
  function rememberCurrentPosition() {
    try {
      window.sessionStorage.setItem(
        DISCOVERY_SCROLL_STORAGE_KEY,
        JSON.stringify({
          href: `${window.location.pathname}${window.location.search}`,
          scrollY: Math.max(0, Math.round(window.scrollY)),
          savedAt: Date.now(),
        })
      );
    } catch {
      // Navigarea rămâne funcțională și fără sessionStorage.
    }
  }

  return (
    <Link href={href} onClick={rememberCurrentPosition} {...props}>
      {children}
    </Link>
  );
}
