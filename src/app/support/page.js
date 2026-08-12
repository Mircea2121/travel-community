import { LifeBuoy } from "lucide-react";
import SupportForm from "@/app/components/information/supportForm";
import "@/app/components/information/information.css";

export const metadata = { title: "Suport | Comunitatea Călătorilor" };

export default function SupportPage() {
  return <main className="info-page"><div className="info-shell"><header className="info-hero"><span className="info-kicker"><LifeBuoy size={17}/>Centru de ajutor</span><h1>Cu ce te putem ajuta?</h1><p>Trimite o problemă tehnică, o întrebare despre cont sau o sugestie. Solicitarea este înregistrată și primește un număr unic de referință.</p></header><div className="info-grid"><section className="info-card"><h2>Trimite o solicitare</h2><SupportForm /></section><aside className="info-card"><h2>Înainte să trimiți</h2><ul><li>Descrie pașii care au produs problema.</li><li>Menționează pagina și dispozitivul folosit.</li><li>Nu include parola sau date bancare.</li><li>Pentru conținut abuziv folosește opțiunea „Raportează” de lângă conținut.</li></ul><h3>Securitatea contului</h3><p>Nu îți vom cere niciodată parola prin email sau prin formularul de suport.</p></aside></div></div></main>;
}

