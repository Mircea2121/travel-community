"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="navbar">
      <a href="/" className="navbar__logo" onClick={closeMenu}>
        Comunitatea Călătorilor
      </a>

      <nav className="navbar__desktopLinks">
        <a href="#explore">Explorează</a>
        <a href="#destinatii">Destinații</a>
        <a href="#recenzii">Recenzii</a>
      </nav>

      <div className="navbar__desktopActions">
        <a href="#login">Autentificare</a>
        <a href="#register" className="navbar__button">
          Creează cont
        </a>
      </div>

      <button
        className="navbar__menuButton"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Meniu"
      >
        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {isMenuOpen && (
        <nav className="navbar__mobileMenu">
          <a href="#explore" onClick={closeMenu}>Explorează</a>
          <a href="#destinatii" onClick={closeMenu}>Destinații</a>
          <a href="#recenzii" onClick={closeMenu}>Recenzii</a>
          <a href="#login" onClick={closeMenu}>Autentificare</a>
          <a href="#register" className="navbar__mobileButton" onClick={closeMenu}>
            Creează cont
          </a>
        </nav>
      )}
    </header>
  );
}