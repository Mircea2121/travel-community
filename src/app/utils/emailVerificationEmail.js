import { sendTransactionalEmail } from "./email";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getAppUrl() {
  const value = process.env.APP_URL?.trim();

  if (!value) {
    throw new Error("APP_URL nu este configurat.");
  }

  return value.replace(/\/$/, "");
}

export async function sendEmailVerificationEmail({ email, name, token }) {
  const verificationUrl = `${getAppUrl()}/verify-email?token=${encodeURIComponent(
    token
  )}`;
  const safeName = escapeHtml(name || "călător");

  return sendTransactionalEmail({
    to: email,
    subject: "Confirmă adresa de email",
    text: `Salut, ${name || "călător"}! Confirmă adresa de email accesând: ${verificationUrl}. Linkul expiră în 24 de ore.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#17233a">
        <h1 style="font-size:28px">Confirmă adresa de email</h1>
        <p>Salut, <strong>${safeName}</strong>!</p>
        <p>Confirmă adresa folosită pentru contul tău din Comunitatea Călătorilor.</p>
        <p style="margin:30px 0">
          <a href="${verificationUrl}" style="background:#079bd8;color:#fff;padding:14px 22px;border-radius:10px;text-decoration:none;font-weight:700">
            Confirmă emailul
          </a>
        </p>
        <p>Linkul este valabil 24 de ore și poate fi folosit o singură dată.</p>
        <p>Dacă nu ai creat acest cont, poți ignora mesajul.</p>
      </div>
    `,
    tags: [{ name: "category", value: "email-verification" }],
  });
}

