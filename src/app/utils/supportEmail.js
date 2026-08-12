import { sendTransactionalEmail } from "./email";
import { SITE_CONFIG } from "./siteConfig";

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendSupportRequestNotification(request) {
  const reference = request.reference;
  const subject = `[${reference}] ${request.subject}`;
  const text = [
    `Solicitare nouă: ${reference}`,
    `Tip: ${request.type}`,
    `Nume: ${request.name}`,
    `Email: ${request.email}`,
    "",
    request.message,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#17233a">
      <h1 style="font-size:22px">Solicitare nouă ${escapeHtml(reference)}</h1>
      <p><strong>Tip:</strong> ${escapeHtml(request.type)}</p>
      <p><strong>Nume:</strong> ${escapeHtml(request.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(request.email)}</p>
      <div style="padding:18px;background:#f5f9ff;border-radius:14px;white-space:pre-wrap">${escapeHtml(request.message)}</div>
    </div>`;

  return sendTransactionalEmail({
    to: SITE_CONFIG.contactEmail,
    replyTo: request.email,
    subject,
    text,
    html,
    tags: [{ name: "category", value: "support-request" }],
  });
}

