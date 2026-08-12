import Link from "next/link";
import { FileText } from "lucide-react";
import { SITE_CONFIG } from "@/app/utils/siteConfig";
import "@/app/components/information/information.css";
import "@/app/components/information/legal.css";

export const metadata = { title: `Termeni și condiții | ${SITE_CONFIG.name}` };

export default function TermsPage() {
  return (
    <main className="info-page"><article className="info-shell legal-document">
      <header className="info-hero"><span className="info-kicker"><FileText size={17}/> Document legal</span><h1>Termeni și condiții</h1><p>Acești termeni stabilesc regulile contractuale pentru folosirea site-ului {SITE_CONFIG.domain} și a funcțiilor Comunitatea Călătorilor.</p><p className="legal-updated">Ultima actualizare: {SITE_CONFIG.legalUpdatedAt}</p></header>
      <section className="info-card legal-card">
        <h2>1. Operator și acceptare</h2><p>Serviciul este administrat de {SITE_CONFIG.operatorName}, {SITE_CONFIG.jurisdiction}, denumit în continuare „Platforma”. Prin crearea unui cont sau folosirea serviciului confirmi că ai citit și accepți acești termeni, <Link href="/regulament">Regulamentul</Link> și <Link href="/confidentialitate">Politica de confidențialitate</Link>.</p>
        <h2>2. Eligibilitate și cont</h2><p>Trebuie să ai cel puțin {SITE_CONFIG.minimumAge} ani. Ești responsabil pentru corectitudinea datelor, confidențialitatea parolei și activitatea contului. Anunță-ne imediat dacă suspectezi acces neautorizat.</p>
        <h2>3. Funcțiile serviciului</h2><p>Platforma permite publicarea experiențelor, fotografiilor și comentariilor, salvarea și aprecierea postărilor, urmărirea utilizatorilor și comunicarea privată. Putem îmbunătăți sau retrage funcții, cu informarea utilizatorilor când schimbarea este importantă.</p>
        <h2>4. Conținutul utilizatorului</h2><p>Rămâi titularul drepturilor asupra conținutului publicat. Ne acorzi o licență neexclusivă, mondială, gratuită și sublicențiabilă numai cât este necesar găzduirii, afișării, adaptării tehnice și distribuirii lui în Platformă. Licența încetează la ștergerea din sistemele active, exceptând copiile de siguranță temporare și păstrarea impusă de lege.</p><p>Garantezi că deții drepturile și acordurile necesare și că materialul nu încalcă legea, drepturile altor persoane sau Regulamentul.</p>
        <h2>5. Informații despre călătorii</h2><p>Postările reflectă opiniile membrilor, nu recomandări profesionale și nici garanții ale Platformei. Prețurile, regulile de intrare, siguranța și disponibilitatea se pot schimba. Verifică informațiile importante în surse oficiale.</p>
        <h2>6. Moderare și suspendare</h2><p>Putem lua măsuri proporționale pentru încălcări: avertizare, limitarea vizibilității, eliminarea conținutului, suspendarea sau închiderea contului. Poți contesta o decizie prin <Link href="/support">suport</Link>.</p>
        <h2>7. Disponibilitate și răspundere</h2><p>Depunem eforturi rezonabile pentru un serviciu sigur și disponibil, fără a garanta funcționarea neîntreruptă. În limitele legii, nu răspundem pentru decizii bazate exclusiv pe conținutul membrilor sau serviciile terților. Drepturile obligatorii ale consumatorilor rămân neafectate.</p>
        <h2>8. Închiderea contului</h2><p>Îți poți șterge contul din setări. Anumite date pot fi păstrate limitat pentru securitate, soluționarea disputelor, prevenirea fraudei și obligații legale.</p>
        <h2>9. Actualizări</h2><p>Putem actualiza documentul pentru schimbări de funcționalitate sau cerințe legale. Pentru modificări importante vom oferi o notificare rezonabilă.</p>
        <h2>10. Legea aplicabilă și contact</h2><p>Se aplică legea română, fără a restrânge protecțiile obligatorii ale utilizatorului. Ne poți contacta la <a href={`mailto:${SITE_CONFIG.contactEmail}`}>{SITE_CONFIG.contactEmail}</a>.</p>
      </section>
    </article></main>
  );
}
