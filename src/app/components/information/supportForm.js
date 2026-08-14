"use client";

import { useCallback, useState } from "react";
import { Send } from "lucide-react";
import { SUPPORT_REQUEST_TYPES } from "@/app/utils/supportConfig";
import TurnstileWidget from "@/app/components/security/turnstileWidget";

const INITIAL_FORM = { name: "", email: "", type: "technical", subject: "", message: "", website: "" };

export default function SupportForm({ defaultType = "technical" }) {
  const [form, setForm] = useState({ ...INITIAL_FORM, type: defaultType });
  const [status, setStatus] = useState({ type: "", message: "", reference: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const handleTurnstileToken = useCallback((token) => setTurnstileToken(token), []);
  const turnstileConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  function update(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (isSubmitting || (turnstileConfigured && !turnstileToken)) return;
    setIsSubmitting(true);
    setStatus({ type: "", message: "", reference: "" });
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, turnstileToken }),
      });
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) throw new Error("Serverul a trimis un răspuns neașteptat.");
      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error(payload?.message || "Solicitarea nu a putut fi trimisă.");
      setStatus({ type: "success", message: payload.message, reference: payload.reference || "" });
      setForm({ ...INITIAL_FORM, type: defaultType });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Solicitarea nu a putut fi trimisă.", reference: "" });
    } finally {
      setTurnstileToken("");
      setTurnstileResetKey((value) => value + 1);
      setIsSubmitting(false);
    }
  }

  return (
    <form className="support-form" onSubmit={submit}>
      <div className="support-row">
        <div className="support-field"><label htmlFor="support-name">Nume</label><input id="support-name" name="name" value={form.name} onChange={update} maxLength={100} autoComplete="name" required /></div>
        <div className="support-field"><label htmlFor="support-email">Email</label><input id="support-email" name="email" type="email" value={form.email} onChange={update} maxLength={254} autoComplete="email" required /></div>
      </div>
      <div className="support-field"><label htmlFor="support-type">Tipul solicitării</label><select id="support-type" name="type" value={form.type} onChange={update}>{SUPPORT_REQUEST_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
      <div className="support-field"><label htmlFor="support-subject">Subiect</label><input id="support-subject" name="subject" value={form.subject} onChange={update} minLength={5} maxLength={160} required /></div>
      <div className="support-field"><label htmlFor="support-message">Mesaj</label><textarea id="support-message" name="message" value={form.message} onChange={update} minLength={20} maxLength={5000} required /><small>{form.message.length}/5000</small></div>
      <div className="support-honeypot" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" value={form.website} onChange={update} tabIndex={-1} autoComplete="off" /></div>
      <TurnstileWidget action="support" onTokenChange={handleTurnstileToken} resetKey={turnstileResetKey} />
      {status.message && <div className={`support-status support-${status.type}`} role="status">{status.message}{status.reference && <><br /><strong>{status.reference}</strong></>}</div>}
      <button className="info-button info-button-primary" type="submit" disabled={isSubmitting || (turnstileConfigured && !turnstileToken)}><Send size={17} />{isSubmitting ? "Se trimite..." : "Trimite solicitarea"}</button>
    </form>
  );
}

