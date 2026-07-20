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

  const scrollToSection = (id) => {
    const section = document.getElementById(id);

    if (!section) {
      return;
    }

    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="footer-logo">
            <Globe size={26} strokeWidth={2} />
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
            onClick={() => scrollToSection("hero")}
          >
            <ChevronRight size={16} />
            Explorează
          </button>

          <button
            type="button"
            onClick={() => scrollToSection("destinations")}
          >
            <ChevronRight size={16} />
            Destinații
          </button>

          <button
            type="button"
            onClick={() => scrollToSection("reviews")}
          >
            <ChevronRight size={16} />
            Recenzii
          </button>

          <button
            type="button"
            onClick={() => scrollToSection("blog")}
          >
            <ChevronRight size={16} />
            Blog
          </button>

          <button
            type="button"
            onClick={() => scrollToSection("about")}
          >
            <ChevronRight size={16} />
            Despre noi
          </button>
        </div>

        <div className="footer-column">
          <h4>Ajutor</h4>

          <button
            type="button"
            onClick={() => router.push("/support")}
          >
            <LifeBuoy size={16} />
            Suport
          </button>

          <button
            type="button"
            onClick={() => router.push("/report")}
          >
            <ShieldAlert size={16} />
            Raportează
          </button>

          <button
            type="button"
            onClick={() => router.push("/contact")}
          >
            <Mail size={16} />
            Contact
          </button>
        </div>

        <div className="footer-column">
          <h4>Legal</h4>

          <button
            type="button"
            onClick={() => router.push("/regulament")}
          >
            <FileText size={16} />
            Regulament
          </button>

          <button
            type="button"
            onClick={() => router.push("/termeni")}
          >
            <FileText size={16} />
            Termeni și condiții
          </button>

          <button
            type="button"
            onClick={() => router.push("/confidentialitate")}
          >
            <FileText size={16} />
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