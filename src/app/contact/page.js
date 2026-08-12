import { Mail } from "lucide-react";
import SupportForm from "@/app/components/information/supportForm";
import { SITE_CONFIG } from "@/app/utils/siteConfig";
import "@/app/components/information/information.css";

export const metadata = { title: "Contact | Comunitatea Călătorilor" };

export default function ContactPage() {
  return <main className="info-page"><div className="info-shell"><header className="info-hero"><span className="info-kicker"><Mail size={17}/>Contact</span><h1>Hai să păstrăm legătura</h1><p>Pentru întrebări generale, feedback, presă sau colaborări, ne poți scrie folosind formularul de mai jos.</p></header><div className="info-grid"><section className="info-card"><h2>Scrie-ne</h2><SupportForm defaultType="other" /></section><aside className="info-card"><h2>Date de contact</h2><p><strong>Email:</strong><br/><a href={`mailto:${SITE_CONFIG.contactEmail}`}>{SITE_CONFIG.contactEmail}</a></p><p>Operator: {SITE_CONFIG.operatorName}, România.</p><h3>Sesizări despre conținut</h3><p>Pentru o postare, un comentariu, un mesaj sau un profil, folosește raportarea disponibilă direct lângă acel conținut.</p></aside></div></div></main>;
}

