"use client";

import "./footer.css";

import Link from "next/link";
import {
  ChevronRight,
  Cookie,
  FileText,
  Globe,
  LifeBuoy,
  Mail,
  ShieldAlert,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="footer-logo">
            <Globe size={26} strokeWidth={2} aria-hidden="true" />
          </div>

          <h3>Comunitatea Călătorilor</h3>

          <p>
            O comunitate pentru românii pasionați de călătorii. Experiențe
            reale, recomandări și sfaturi utile pentru fiecare destinație.
          </p>
        </div>

        <div className="footer-column">
          <h4>Navigare</h4>

          <Link href="/#hero">
            <ChevronRight size={16} aria-hidden="true" />
            Explorează
          </Link>

          <Link
            href="/#destinations"
          >
            <ChevronRight size={16} aria-hidden="true" />
            Destinații
          </Link>

          <Link href="/#reviews">
            <ChevronRight size={16} aria-hidden="true" />
            Recomandări
          </Link>

          <Link href="/blog">
            <ChevronRight size={16} aria-hidden="true" />
            Postări
          </Link>

          <Link href="/despre-noi">
            <ChevronRight size={16} aria-hidden="true" />
            Despre noi
          </Link>
        </div>

        <div className="footer-column">
          <h4>Ajutor</h4>
          <Link href="/ghid-publicare"><FileText size={16} aria-hidden="true" />Ghid de publicare</Link>

          <Link href="/support">
            <LifeBuoy size={16} aria-hidden="true" />
            Suport
          </Link>

          <Link href="/report">
            <ShieldAlert size={16} aria-hidden="true" />
            Raportează
          </Link>

          <Link href="/contact">
            <Mail size={16} aria-hidden="true" />
            Contact
          </Link>
        </div>

        <div className="footer-column">
          <h4>Legal</h4>

          <Link href="/regulament">
            <FileText size={16} aria-hidden="true" />
            Regulament
          </Link>

          <Link href="/termeni">
            <FileText size={16} aria-hidden="true" />
            Termeni și condiții
          </Link>

          <Link
            href="/confidentialitate"
          >
            <FileText size={16} aria-hidden="true" />
            Politica de confidențialitate
          </Link>

          <Link href="/cookies">
            <Cookie size={16} aria-hidden="true" />
            Politica de cookie-uri
          </Link>
        </div>
      </div>

      <div className="footer-bottom">
        © 2026 Comunitatea Călătorilor. Toate drepturile rezervate.
      </div>
    </footer>
  );
}
