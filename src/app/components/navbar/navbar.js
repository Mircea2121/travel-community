"use client";

import "./navbar.css";
import {
  Search,
  CircleUserRound,
  Menu,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] =
    useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);

  const searchInputRef = useRef(null);

  const navigateTo = (path) => {
    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(false);
    router.push(path);
  };

  const scrollToSection = (id) => {
    setIsMobileMenuOpen(false);

    if (window.location.pathname !== "/") {
      router.push(`/#${id}`);
      return;
    }

    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const openMobileSearch = () => {
    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(true);

    window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  const closeMobileSearch = () => {
    setIsMobileSearchOpen(false);
    setSearchQuery("");
  };

  const handleSearch = (event) => {
    event.preventDefault();

    const cleanQuery = searchQuery.trim();

    if (!cleanQuery) {
      searchInputRef.current?.focus();
      return;
    }

    setIsMobileSearchOpen(false);
    setIsMobileMenuOpen(false);

    router.push(
      `/search?q=${encodeURIComponent(cleanQuery)}`
    );
  };

  const toggleMobileMenu = () => {
    setIsMobileSearchOpen(false);
    setIsMobileMenuOpen((currentState) => !currentState);
  };

  return (
    <>
      <header className="navbar">
        <button
          type="button"
          className="nav-logo"
          onClick={() => navigateTo("/")}
          aria-label="Mergi la pagina principală"
        >
          <div className="nav-logo-icon">
            <svg
              className="nav-globe"
              viewBox="0 0 64 64"
              aria-hidden="true"
            >
              <circle
                className="globe-main"
                cx="32"
                cy="32"
                r="23"
              />

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
            onClick={() =>
              scrollToSection("destinations")
            }
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
          <form
            className={`nav-search ${
              isMobileSearchOpen
                ? "nav-search-open"
                : ""
            }`}
            onSubmit={handleSearch}
          >
            <button
              type="button"
              className="nav-search-toggle"
              onClick={openMobileSearch}
              aria-label="Deschide căutarea"
            >
              <Search
                size={20}
                strokeWidth={2}
              />
            </button>

            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Caută destinații"
              aria-label="Caută destinații"
            />

            <button
              type="submit"
              className="nav-search-submit"
              aria-label="Caută"
            >
              <Search
                size={18}
                strokeWidth={2.2}
              />
            </button>

            <button
              type="button"
              className="nav-search-close"
              onClick={closeMobileSearch}
              aria-label="Închide căutarea"
            >
              <X
                size={20}
                strokeWidth={2.2}
              />
            </button>
          </form>

          <button
            type="button"
            className="nav-login"
            onClick={() => navigateTo("/login")}
            aria-label="Autentificare"
            title="Autentificare"
          >
            <CircleUserRound
              size={24}
              strokeWidth={2}
            />
          </button>

          <button
            type="button"
            className="nav-create"
            onClick={() =>
              navigateTo("/create-experience")
            }
          >
            Creează postare
          </button>

          <button
            type="button"
            className="nav-burger"
            onClick={toggleMobileMenu}
            aria-label={
              isMobileMenuOpen
                ? "Închide meniul"
                : "Deschide meniul"
            }
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X
                size={25}
                strokeWidth={2.2}
              />
            ) : (
              <Menu
                size={25}
                strokeWidth={2.2}
              />
            )}
          </button>
        </div>
      </header>

      <div
        className={`mobile-menu ${
          isMobileMenuOpen ? "mobile-menu-open" : ""
        }`}
      >
        <nav className="mobile-menu-links">
          <button
            type="button"
            onClick={() => scrollToSection("hero")}
          >
            Explorează
          </button>

          <button
            type="button"
            onClick={() =>
              scrollToSection("destinations")
            }
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

        <div className="mobile-menu-actions">
          <button
            type="button"
            className="mobile-login-button"
            onClick={() => navigateTo("/login")}
          >
            <CircleUserRound
              size={21}
              strokeWidth={2}
            />

            <span>Autentificare</span>
          </button>

          <button
            type="button"
            className="mobile-create-button"
            onClick={() =>
              navigateTo("/create-experience")
            }
          >
            Creează postare
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <button
          type="button"
          className="mobile-menu-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Închide meniul"
        />
      )}
    </>
  );
}