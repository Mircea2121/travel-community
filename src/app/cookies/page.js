import Link from "next/link";
import { Cookie } from "lucide-react";

import "@/app/components/information/information.css";
import "@/app/components/information/legal.css";
import { SITE_CONFIG } from "@/app/utils/siteConfig";

export const metadata = {
  title: `Politica de cookie-uri | ${SITE_CONFIG.name}`,
  description:
    "Informații despre cookie-urile și tehnologiile de stocare folosite de Comunitatea Călătorilor.",
};

export default function CookiesPage() {
  return (
    <main className="info-page">
      <article className="info-shell legal-document">
        <header className="info-hero">
          <span className="info-kicker">
            <Cookie size={17} aria-hidden="true" />
            Transparență și control
          </span>

          <h1>Politica de cookie-uri</h1>

          <p>
            Aici explicăm ce cookie-uri și tehnologii similare folosim,
            de ce sunt necesare și cât timp sunt păstrate.
          </p>

          <p className="legal-updated">
            Ultima actualizare: {SITE_CONFIG.legalUpdatedAt}
          </p>
        </header>

        <section className="info-card legal-card">
          <h2>1. Ce este un cookie</h2>
          <p>
            Un cookie este o informație de dimensiuni mici pe care un site
            o poate salva în browser. Cookie-urile pot menține o sesiune,
            pot reține preferințe sau, dacă sunt folosite în acest scop,
            pot ajuta la măsurarea utilizării unui site.
          </p>

          <h2>2. Ce folosim în prezent</h2>
          <p>
            {SITE_CONFIG.name} folosește în prezent un singur cookie
            propriu, strict necesar autentificării și securității contului.
            Nu folosim în prezent cookie-uri de analiză, publicitate sau
            profilare.
          </p>

          <div className="legal-table-wrap">
            <table className="legal-table">
              <caption>Inventarul cookie-urilor active</caption>
              <thead>
                <tr>
                  <th scope="col">Nume</th>
                  <th scope="col">Furnizor</th>
                  <th scope="col">Scop</th>
                  <th scope="col">Durată</th>
                  <th scope="col">Categorie</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>token</code></td>
                  <td>{SITE_CONFIG.domain}</td>
                  <td>
                    Menține autentificarea, verifică sesiunea și protejează
                    accesul la funcțiile contului.
                  </td>
                  <td>
                    Maximum 7 zile sau până la deconectare, schimbarea
                    parolei ori invalidarea sesiunii.
                  </td>
                  <td>Strict necesar</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>3. Protecția cookie-ului de autentificare</h2>
          <p>
            Cookie-ul <code>token</code> este configurat <code>HttpOnly</code>,
            astfel încât nu poate fi citit de codul JavaScript din pagină.
            Este transmis numai prin conexiuni securizate în producție și
            folosește politica <code>SameSite=Lax</code>. Cookie-ul nu conține
            parola. El conține date tehnice necesare identificării și
            validării sesiunii.
          </p>

          <h2>4. De ce nu afișăm un banner de consimțământ</h2>
          <p>
            Cookie-ul de autentificare este strict necesar serviciului cerut
            de utilizator și nu este folosit pentru analiză, reclamă sau
            urmărire. Din acest motiv nu solicităm consimțământ pentru el.
            Refuzarea sa ar împiedica autentificarea și folosirea funcțiilor
            asociate contului.
          </p>

          <h2>5. Stocarea locală a browserului</h2>
          <p>
            Putem utiliza temporar <code>sessionStorage</code> pentru funcții
            strict tehnice ale interfeței, precum păstrarea poziției în pagină
            la revenire sau controlul afișării unor elemente în sesiunea
            curentă. Aceste date rămân în browser, nu sunt folosite pentru
            publicitate și sunt eliminate de browser la încheierea sesiunii.
          </p>

          <h2>6. Servicii externe</h2>
          <p>
            Unele resurse, precum imaginile, pot fi livrate prin furnizori
            tehnici. Folosirea unui furnizor extern nu înseamnă automat că
            acesta poate instala cookie-uri opționale prin site-ul nostru.
            Orice tehnologie externă care ar necesita consimțământ va fi
            blocată până la exprimarea opțiunii utilizatorului.
          </p>

          <h2>7. Tehnologii opționale viitoare</h2>
          <p>
            Dacă vom introduce analiză, marketing, conținut extern cu
            urmărire sau alte tehnologii opționale, vom actualiza această
            pagină și vom solicita consimțământul înainte de activarea lor.
            Utilizatorii vor putea accepta, refuza și modifica separat
            opțiunile, fără ca refuzul să împiedice funcțiile de bază.
          </p>

          <h2>8. Controlul din browser</h2>
          <p>
            Poți vedea sau șterge cookie-urile din setările browserului.
            Ștergerea cookie-ului <code>token</code> te va deconecta, iar
            pentru a folosi din nou funcțiile contului va trebui să te
            autentifici.
          </p>

          <h2>9. Actualizări și contact</h2>
          <p>
            Putem actualiza politica dacă se schimbă funcțiile site-ului sau
            cerințele legale. Pentru întrebări, scrie la{" "}
            <a href={`mailto:${SITE_CONFIG.contactEmail}`}>
              {SITE_CONFIG.contactEmail}
            </a>{" "}
            sau folosește <Link href="/contact">formularul de contact</Link>.
          </p>

          <p className="info-meta">
            Această politică completează{" "}
            <Link href="/confidentialitate">
              Politica de confidențialitate
            </Link>{" "}
            și <Link href="/termeni">Termenii și condițiile</Link>.
          </p>
        </section>
      </article>
    </main>
  );
}
