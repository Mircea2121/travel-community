import { Resend } from "resend";

let resendClient = null;

function getRequiredEnvironmentValue(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Variabila de mediu ${name} nu este configurată.`
    );
  }

  return value;
}

function getResendClient() {
  if (!resendClient) {
    resendClient = new Resend(
      getRequiredEnvironmentValue("RESEND_API_KEY")
    );
  }

  return resendClient;
}

function normalizeRecipients(recipients) {
  const values = Array.isArray(recipients)
    ? recipients
    : [recipients];

  const normalizedRecipients = values
    .filter((value) => typeof value === "string")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (normalizedRecipients.length === 0) {
    throw new TypeError(
      "Emailul trebuie să aibă cel puțin un destinatar."
    );
  }

  return normalizedRecipients;
}

export async function sendTransactionalEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  tags,
}) {
  const normalizedSubject =
    typeof subject === "string"
      ? subject.trim()
      : "";

  if (!normalizedSubject) {
    throw new TypeError(
      "Subiectul emailului este obligatoriu."
    );
  }

  if (
    (typeof html !== "string" || !html.trim()) &&
    (typeof text !== "string" || !text.trim())
  ) {
    throw new TypeError(
      "Emailul trebuie să conțină o versiune HTML sau text."
    );
  }

  const email = {
    from: getRequiredEnvironmentValue("EMAIL_FROM"),
    to: normalizeRecipients(to),
    subject: normalizedSubject,
  };

  if (typeof html === "string" && html.trim()) {
    email.html = html;
  }

  if (typeof text === "string" && text.trim()) {
    email.text = text;
  }

  if (typeof replyTo === "string" && replyTo.trim()) {
    email.replyTo = replyTo.trim();
  }

  if (Array.isArray(tags) && tags.length > 0) {
    email.tags = tags;
  }

  const { data, error } =
    await getResendClient().emails.send(email);

  if (error) {
    const sendError = new Error(
      error.message || "Emailul nu a putut fi trimis."
    );

    sendError.name = "EmailDeliveryError";
    sendError.code = error.name || "EMAIL_DELIVERY_FAILED";

    throw sendError;
  }

  return data;
}
