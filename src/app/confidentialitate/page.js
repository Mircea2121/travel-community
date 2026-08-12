import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import "@/app/components/information/information.css";
import "@/app/components/information/legal.css";
import { SITE_CONFIG } from "@/app/utils/siteConfig";

export const metadata = {
  title: `Politica de confidențialitate | ${SITE_CONFIG.name}`,
};

export default function PrivacyPage() {
  return (
    <main className="info-page">
      <article className="info-shell legal-document">
        <header className="info-hero">
          <span className="info-kicker">
            <LockKeyhole size={17} aria-hidden="true" />
            Date personale
          </span>

          <h1>Politica de confidențialitate</h1>

          <p>
            Aici explicăm ce date folosim, de ce le folosim și ce control ai
            asupra lor.
          </p>

          <p className="legal-updated">
            Ultima actualizare: {SITE_CONFIG.legalUpdatedAt}
          </p>
        </header>

        <section className="info-card legal-card">
          <h2>1. Operator</h2>
          <p>
            Operatorul datelor este {SITE_CONFIG.operatorName},{" "}
            {SITE_CONFIG.jurisdiction}. Pentru întrebări sau exercitarea
            drepturilor scrie la{" "}
            <a href={`mailto:${SITE_CONFIG.contactEmail}`}>
              {SITE_CONFIG.contactEmail}
            </a>{" "}
            ori folosește <Link href="/contact">formularul de contact</Link>.
          </p>

          <h2>2. Date colectate</h2>
          <ul>
            <li>
              <strong>Cont:</strong> nume, username, email, parola stocată
              numai ca hash și datele profilului.
            </li>
            <li>
              <strong>Conținut:</strong> postări, fotografii, comentarii,
              reacții, salvări, urmăritori și raportări.
            </li>
            <li>
              <strong>Mesaje:</strong> conversațiile și metadatele necesare
              livrării, citirii și siguranței.
            </li>
            <li>
              <strong>Tehnice:</strong> IP, browser sau dispozitiv, sesiuni,
              jurnale de securitate și erori.
            </li>
            <li>
              <strong>Suport:</strong> nume, email, subiect, mesaj și istoricul
              soluționării.
            </li>
          </ul>

          <h2>3. Scopuri și temeiuri</h2>
          <ul>
            <li>
              <strong>Executarea contractului:</strong> cont, publicare, feed,
              mesaje și setări.
            </li>
            <li>
              <strong>Interes legitim:</strong> securitate, prevenirea fraudei,
              moderare și diagnostic.
            </li>
            <li>
              <strong>Obligație legală:</strong> cereri valide ale autorităților
              și păstrarea impusă de lege.
            </li>
            <li>
              <strong>Consimțământ:</strong> funcții opționale, acolo unde este
              necesar.
            </li>
          </ul>

          <h2>4. Vizibilitate</h2>
          <p>
            Profilul, postările și comentariile pot fi publice. Mesajele sunt
            vizibile participanților și pot fi accesate limitat de personal
            autorizat când este necesar pentru raportări, securitate sau
            obligații legale.
          </p>

          <h2>5. Furnizori și destinatari</h2>
          <p>
            Folosim furnizori pentru infrastructură, baza de date, stocarea
            imaginilor, email și monitorizare tehnică. Ei primesc numai datele
            necesare și acționează conform contractelor. Nu vindem date
            personale.
          </p>

          <h2>6. Transferuri internaționale</h2>
          <p>
            Pentru prelucrare în afara Spațiului Economic European folosim
            mecanisme recunoscute legal, precum decizii de adecvare sau clauze
            contractuale standard, și măsuri suplimentare când sunt necesare.
          </p>

          <h2>7. Păstrare</h2>
          <p>
            Păstrăm datele contului cât timp acesta este activ. După ștergere
            eliminăm sau anonimizăm datele conform ciclurilor operaționale și
            de backup, exceptând obligațiile legale, securitatea, prevenirea
            fraudei și soluționarea raportărilor.
          </p>

          <h2>8. Drepturile tale</h2>
          <p>
            În condițiile legii, poți cere acces, rectificare, ștergere,
            restricționare, portabilitate și te poți opune anumitor prelucrări.
            Poți retrage consimțământul. Ai dreptul să depui plângere la
            Autoritatea Națională de Supraveghere a Prelucrării Datelor cu
            Caracter Personal.
          </p>

          <h2>9. Securitate și minori</h2>
          <p>
            Aplicăm măsuri tehnice și organizatorice, fără ca vreun serviciu
            online să poată garanta risc zero. Platforma nu este destinată
            persoanelor sub {SITE_CONFIG.minimumAge} ani.
          </p>

          <h2>10. Cookie-uri și stocare în browser</h2>
          <p>
            Folosim un cookie strict necesar pentru autentificare, securitate
            și sesiune, precum și stocare temporară în browser pentru anumite
            funcții tehnice ale interfeței. Nu folosim în prezent cookie-uri de
            analiză sau publicitate. Detaliile, durata și opțiunile disponibile
            sunt prezentate în <Link href="/cookies">Politica de cookie-uri</Link>.
          </p>

          <h2>11. Actualizări</h2>
          <p>
            Putem actualiza politica atunci când serviciul sau legislația se
            schimbă. Vom modifica data și vom anunța schimbările importante.
          </p>
        </section>
      </article>
    </main>
  );
}
