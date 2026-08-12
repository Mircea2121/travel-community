import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import "@/app/components/information/information.css";

export const metadata = { title: "Raportează | Comunitatea Călătorilor" };

export default function ReportPage() {
  return (
    <main className="info-page">
      <div className="info-shell">
        <header className="info-hero">
          <span className="info-kicker"><ShieldAlert size={17}/> Siguranța comunității</span>
          <h1>Raportează conținutul problematic</h1>
          <p>Raportarea este legată de elementul exact, pentru ca echipa să poată verifica rapid contextul și să ia o decizie corectă.</p>
          <div className="info-actions"><Link className="info-button info-button-primary" href="/blog">Vezi postările</Link><Link className="info-button" href="/support">Am altă problemă</Link></div>
        </header>
        <section className="info-card" style={{ marginTop: 24 }}>
          <h2>Cum trimiți un raport</h2>
          <div className="report-steps"><div className="report-step">Deschide postarea, comentariul, profilul, conversația sau mesajul.</div><div className="report-step">Apasă meniul cu trei puncte și selectează „Raportează”.</div><div className="report-step">Alege motivul și oferă detalii relevante. Raportul intră în sistemul de moderare.</div></div>
          <h3>Raportări corecte</h3>
          <p>Nu folosi raportarea pentru dezacorduri personale sau pentru a hărțui alți membri. Rapoartele abuzive pot conduce la limitarea contului.</p>
        </section>
      </div>
    </main>
  );
}
