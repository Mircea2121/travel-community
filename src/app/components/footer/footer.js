"use client";

import "./footer.css";

import { useRouter } from "next/navigation";
import {
  ChevronRight,
  FileText,
  Globe,
  LifeBuoy,
  Mail,
  ShieldAlert,
} from "lucide-react";

export default function Footer() {
  const router = useRouter();

  function navigateToSection(id) {
    if (window.location.pathname !== "/") {
      router.push(`/#${id}`);
      return;
    }

    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function navigateTo(path) {
    router.push(path);
  }

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="footer-logo">
            <Globe size={26} strokeWidth={2} aria-hidden="true" />
          </div>

          <h3>Comunitatea Călătorilor</h3>

          <p>
            O comunitate pentru românii pasionați de călătorii.
            Experiențe reale, recomandări și sfaturi utile pentru
            fiecare destinație.
          </p>
        </div>

        <div className="footer-column">
          <h4>Navigare</h4>

          <button
            type="button"
            onClick={() => navigateToSection("hero")}
          >
            <ChevronRight size={16} aria-hidden="true" />
            Explorează
          </button>

          <button
            type="button"
            onClick={() => navigateToSection("destinations")}
          >
            <ChevronRight size={16} aria-hidden="true" />
            Destinații
          </button>

          <button
            type="button"
            onClick={() => navigateToSection("reviews")}
          >
            <ChevronRight size={16} aria-hidden="true" />
            Recenzii
          </button>

          <button
            type="button"
            onClick={() => navigateTo("/blog")}
          >
            <ChevronRight size={16} aria-hidden="true" />
            Blog
          </button>

          <button
            type="button"
            onClick={() => navigateToSection("about")}
          >
            <ChevronRight size={16} aria-hidden="true" />
            Despre noi
          </button>
        </div>

        <div className="footer-column">
          <h4>Ajutor</h4>

          <button
            type="button"
            onClick={() => navigateTo("/support")}
          >
            <LifeBuoy size={16} aria-hidden="true" />
            Suport
          </button>

          <button
            type="button"
            onClick={() => navigateTo("/report")}
          >
            <ShieldAlert size={16} aria-hidden="true" />
            Raportează
          </button>

          <button
            type="button"
            onClick={() => navigateTo("/contact")}
          >
            <Mail size={16} aria-hidden="true" />
            Contact
          </button>
        </div>

        <div className="footer-column">
          <h4>Legal</h4>

          <button
            type="button"
            onClick={() => navigateTo("/regulament")}
          >
            <FileText size={16} aria-hidden="true" />
            Regulament
          </button>

          <button
            type="button"
            onClick={() => navigateTo("/termeni")}
          >
            <FileText size={16} aria-hidden="true" />
            Termeni și condiții
          </button>

          <button
            type="button"
            onClick={() => navigateTo("/confidentialitate")}
          >
            <FileText size={16} aria-hidden="true" />
            Politica de confidențialitate
          </button>
        </div>
      </div>

      <div className="footer-bottom">
        © 2026 Comunitatea Călătorilor. Toate drepturile rezervate.
      </div>
    </footer>
  );
}
