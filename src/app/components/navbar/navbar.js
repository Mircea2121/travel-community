"use client";

import "./navbar.css";
import { Search } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");

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

  const handleSearch = (event) => {
    event.preventDefault();

    const cleanQuery = searchQuery.trim();

    if (!cleanQuery) {
      return;
    }

    router.push(`/search?q=${encodeURIComponent(cleanQuery)}`);
  };

  return (
    <header className="navbar">
      <button
        type="button"
        className="nav-logo"
        onClick={() => router.push("/")}
        aria-label="Mergi la pagina principală"
      >
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
        <button
          type="button"
          onClick={() => scrollToSection("hero")}
        >
          Explorează
        </button>

        <button
          type="button"
          onClick={() => scrollToSection("destinations")}
        >
          Destinații
        </button>

        <button
          type="button"
          onClick={() => scrollToSection("reviews")}
        >
          Recenzii
        </button>

        <button
          type="button"
          onClick={() => scrollToSection("blog")}
        >
          Blog
        </button>

        <button
          type="button"
          onClick={() => scrollToSection("about")}
        >
          Despre noi
        </button>
      </nav>

      <div className="nav-actions">
        <form className="nav-search" onSubmit={handleSearch}>
          <svg
            className="nav-search-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />

            <path d="m16.5 16.5 4 4" />
          </svg>

          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Caută destinații"
            aria-label="Caută destinații"
          />

          <button
            type="submit"
            className="nav-search-submit"
            aria-label="Caută"
          >
            <Search size={18} strokeWidth={2.2} />
          </button>
        </form>

        <button
          type="button"
          className="nav-login"
          onClick={() => router.push("/login")}
        >
          Autentificare
        </button>

        <button
          type="button"
          className="nav-create"
          onClick={() => router.push("/create-experience")}
        >
          Creează postare
        </button>
      </div>
    </header>
  );
}