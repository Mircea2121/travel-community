"use client";

import "./navbar.css";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const scrollToSection = (id) => {
    if (window.location.pathname !== "/") {
      router.push("/");
      return;
    }

    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <header className="navbar">
      <button className="nav-logo" onClick={() => router.push("/")}>
        <div className="nav-logo-icon">
          <svg
            className="nav-globe"
            viewBox="0 0 64 64"
            aria-hidden="true"
          >
            <circle className="globe-main" cx="32" cy="32" r="23" />
            <path
              className="globe-line"
              d="M9 32h46M32 9c7 7 10 15 10 23s-3 16-10 23M32 9c-7 7-10 15-10 23s3 16 10 23"
            />
            <path
              className="globe-land"
              d="M24 18c-4 1-8 4-9 8 3 1 6 0 8 2 2 2 0 5 3 7 2 1 5-1 6-4 1-4-3-5-2-8 1-3 5-2 6-5-3-2-8-2-12 0Z"
            />
            <path
              className="globe-land"
              d="M39 34c-4 1-8 4-8 8 0 4 4 7 8 8 5-3 9-8 10-14-3-2-6-3-10-2Z"
            />
          </svg>
        </div>

        <div className="nav-logo-text">
          <strong>Comunitatea</strong>
          <span>Călătorilor</span>
        </div>
      </button>

      <nav className="nav-menu">
        <button onClick={() => scrollToSection("hero")}>Explorează</button>
        <button onClick={() => scrollToSection("destinations")}>
          Destinații
        </button>
        <button onClick={() => scrollToSection("reviews")}>Recenzii</button>
        <button onClick={() => scrollToSection("blog")}>Blog</button>
        <button onClick={() => scrollToSection("about")}>Despre noi</button>
      </nav>

      <div className="nav-actions">
        <button
          className="nav-search"
          onClick={() => scrollToSection("destinations")}
          aria-label="Caută"
        >
          🔍
        </button>

        <button className="nav-login" onClick={() => router.push("/login")}>
          Autentificare
        </button>

        <button
          className="nav-create"
          onClick={() => router.push("/create-experience")}
        >
          Creează postare
        </button>
      </div>
    </header>
  );
}