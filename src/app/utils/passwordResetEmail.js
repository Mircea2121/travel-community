import { sendTransactionalEmail } from "./email";
import {
  PASSWORD_RESET,
  isPasswordResetTokenValid,
} from "./passwordReset";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getApplicationUrl() {
  const configuredUrl = process.env.APP_URL?.trim();

  if (!configuredUrl) {
    throw new Error(
      "Variabila de mediu APP_URL nu este configurată."
    );
  }

  let applicationUrl;

  try {
    applicationUrl = new URL(configuredUrl);
  } catch {
    throw new Error(
      "Variabila de mediu APP_URL nu conține un URL valid."
    );
  }

  if (
    applicationUrl.protocol !== "http:" &&
    applicationUrl.protocol !== "https:"
  ) {
    throw new Error(
      "APP_URL trebuie să folosească protocolul HTTP sau HTTPS."
    );
  }

  return applicationUrl;
}

function createResetUrl(token) {
  if (!isPasswordResetTokenValid(token)) {
    throw new TypeError(
      "Tokenul pentru email nu este valid."
    );
  }

  const resetUrl = new URL(
    "/reset-password",
    getApplicationUrl()
  );

  resetUrl.searchParams.set("token", token);

  return resetUrl.toString();
}

export async function sendPasswordResetEmail({
  email,
  name,
  token,
}) {
  const recipientEmail =
    typeof email === "string"
      ? email.trim().toLowerCase()
      : "";

  if (!recipientEmail) {
    throw new TypeError(
      "Adresa destinatarului este obligatorie."
    );
  }

  const resetUrl = createResetUrl(token);
  const recipientName =
    typeof name === "string" && name.trim()
      ? name.trim()
      : "călătorule";

  const safeName = escapeHtml(recipientName);
  const safeResetUrl = escapeHtml(resetUrl);
  const expirationMinutes =
    PASSWORD_RESET.EXPIRES_IN_MINUTES;

  const subject =
    "Resetează parola contului tău";

  const text = [
    `Salut, ${recipientName}!`,
    "",
    "Am primit o solicitare de resetare a parolei pentru contul tău din Comunitatea Călătorilor.",
    "",
    `Deschide acest link pentru a alege o parolă nouă: ${resetUrl}`,
    "",
    `Linkul este valabil ${expirationMinutes} de minute și poate fi folosit o singură dată.`,
    "",
    "Dacă nu ai cerut resetarea parolei, poți ignora acest mesaj. Parola ta actuală nu va fi modificată.",
    "",
    "Echipa Comunitatea Călătorilor",
  ].join("\n");

  const html = `<!doctype html>
<html lang="ro">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#f1f6fc;font-family:Arial,Helvetica,sans-serif;color:#18253b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f1f6fc;">
      <tr>
        <td align="center" style="padding:32px 14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid #e1eaf4;border-radius:24px;overflow:hidden;box-shadow:0 18px 50px rgba(30,64,110,0.12);">
            <tr>
              <td style="padding:28px 34px;background:linear-gradient(135deg,#087fce,#20afe4);color:#ffffff;">
                <div style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;opacity:0.9;">Comunitatea</div>
                <div style="margin-top:3px;font-size:25px;font-weight:800;line-height:1.2;">Călătorilor</div>
              </td>
            </tr>
            <tr>
              <td style="padding:38px 34px 18px;">
                <h1 style="margin:0 0 18px;font-size:28px;line-height:1.25;color:#17243a;">Alege o parolă nouă</h1>
                <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#52647a;">Salut, <strong style="color:#24354d;">${safeName}</strong>!</p>
                <p style="margin:0;font-size:16px;line-height:1.7;color:#52647a;">Am primit o solicitare de resetare a parolei pentru contul tău. Apasă butonul de mai jos pentru a continua.</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:14px 34px 26px;">
                <a href="${safeResetUrl}" style="display:inline-block;padding:16px 28px;border-radius:14px;background:#168ed8;color:#ffffff;font-size:16px;font-weight:800;text-decoration:none;box-shadow:0 10px 24px rgba(22,142,216,0.25);">Resetează parola</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 34px 32px;">
                <div style="padding:16px 18px;border:1px solid #e3ebf5;border-radius:14px;background:#f8fbff;color:#607289;font-size:14px;line-height:1.6;">
                  Linkul expiră în <strong>${expirationMinutes} de minute</strong> și poate fi folosit o singură dată. Dacă nu ai făcut această solicitare, ignoră emailul; parola ta rămâne neschimbată.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 34px;border-top:1px solid #e7eef6;background:#fbfdff;color:#8290a3;font-size:12px;line-height:1.6;text-align:center;">
                Acesta este un mesaj automat de securitate. Nu răspunde la acest email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return sendTransactionalEmail({
    to: recipientEmail,
    subject,
    html,
    text,
    tags: [
      {
        name: "category",
        value: "password_reset",
      },
    ],
  });
}

