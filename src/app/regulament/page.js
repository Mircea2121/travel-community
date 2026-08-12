import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { SITE_CONFIG } from "@/app/utils/siteConfig";
import "@/app/components/information/information.css";
import "@/app/components/information/legal.css";

export const metadata = { title: `Regulament | ${SITE_CONFIG.name}` };

export default function RulesPage() {
  return (
    <main className="info-page"><article className="info-shell legal-document">
      <header className="info-hero"><span className="info-kicker"><ShieldCheck size={17}/> Reguli ale comunității</span><h1>Regulament</h1><p>Comunitatea funcționează atunci când experiențele sunt autentice, conversațiile rămân civilizate, iar siguranța membrilor este respectată.</p><p className="legal-updated">Ultima actualizare: {SITE_CONFIG.legalUpdatedAt}</p></header>
      <section className="info-card legal-card">
        <h2>1. Cine poate folosi platforma</h2><p>Platforma este destinată persoanelor care au împlinit cel puțin {SITE_CONFIG.minimumAge} ani. Fiecare membru trebuie să folosească informații corecte, să își protejeze contul și să nu permită folosirea lui în mod abuziv.</p>
        <h2>2. Conținut autentic și util</h2><ul><li>Publică experiențe proprii sau conținut pentru care ai dreptul de utilizare.</li><li>Descrie destinațiile, costurile și recomandările cu bună-credință.</li><li>Nu publica informații înșelătoare, recenzii false, spam sau promovare mascată.</li><li>Marchează clar relațiile comerciale, invitațiile și beneficiile primite.</li></ul>
        <h2>3. Respect și siguranță</h2><p>Nu sunt permise:</p><ul><li>hărțuirea, amenințările, intimidarea sau discursul instigator la ură;</li><li>conținutul sexual explicit, exploatarea minorilor sau promovarea violenței;</li><li>publicarea datelor personale ale altcuiva fără acord;</li><li>frauda, phishingul, malware-ul sau tentativele de compromitere a platformei;</li><li>vânzarea de bunuri ori servicii ilegale și îndemnurile la activități ilegale.</li></ul>
        <h2>4. Fotografii și drepturi de autor</h2><p>Păstrezi drepturile asupra conținutului tău, dar trebuie să ai permisiunea de a publica imaginile și persoanele recognoscibile din ele. La o sesizare justificată putem restricționa temporar sau elimina materialul reclamat.</p>
        <h2>5. Mesaje și interacțiuni</h2><p>Mesajele private nu trebuie folosite pentru spam, presiuni, fraude sau hărțuire. Reacțiile, urmăririle și raportările automate ori coordonate pentru manipularea vizibilității sunt interzise.</p>
        <h2>6. Moderare și măsuri</h2><p>În funcție de gravitate, context și repetare, putem limita distribuirea, elimina conținutul, restricționa funcții, suspenda sau închide conturi. Situațiile grave pot fi comunicate autorităților când legea impune acest lucru. Membrul afectat poate cere reanalizarea prin pagina de <Link href="/support">suport</Link>.</p>
        <h2>7. Raportarea încălcărilor</h2><p>Folosește opțiunea „Raportează” de lângă elementul vizat. Raportarea trebuie să fie sinceră și suficient de precisă. Raportările abuzive pot conduce la restricționarea contului.</p>
        <h2>8. Contact</h2><p>Pentru întrebări scrie la <a href={`mailto:${SITE_CONFIG.contactEmail}`}>{SITE_CONFIG.contactEmail}</a>.</p>
      </section>
    </article></main>
  );
}
