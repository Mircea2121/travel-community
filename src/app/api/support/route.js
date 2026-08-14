import { randomBytes } from "node:crypto";
import { after } from "next/server";

import { getCurrentUser } from "@/app/utils/currentUser";
import { getSupportRequestsCollection } from "@/app/utils/database";
import { consumeAuthRateLimit } from "@/app/utils/authRateLimit";
import { getRequestClientIp } from "@/app/utils/requestClient";
import { EMAIL_PATTERN } from "@/app/utils/validation";
import {
  SUPPORT_LIMITS,
  isSupportRequestType,
} from "@/app/utils/supportConfig";
import { sendSupportRequestNotification } from "@/app/utils/supportEmail";
import { verifyTurnstile } from "@/app/utils/turnstile";

export const runtime = "nodejs";
export const maxDuration = 30;

let indexesPromise = null;

function response(body, status = 200, headers = {}) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

function clean(value, maximum) {
  return typeof value === "string" ? value.trim().slice(0, maximum + 1) : "";
}

async function ensureIndexes(collection) {
  if (!indexesPromise) {
    indexesPromise = Promise.all([
      collection.createIndex({ reference: 1 }, { unique: true, name: "support_reference" }),
      collection.createIndex({ status: 1, createdAt: -1 }, { name: "support_queue" }),
      collection.createIndex({ email: 1, createdAt: -1 }, { name: "support_by_email" }),
    ]).catch((error) => {
      indexesPromise = null;
      throw error;
    });
  }
  await indexesPromise;
}

function createReference() {
  const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `CC-${day}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return response({ success: false, message: "Cererea nu este validă." }, 400);
    }

    const currentUser = await getCurrentUser().catch(() => null);
    const name = clean(body?.name || currentUser?.name, SUPPORT_LIMITS.name);
    const email = clean(body?.email || currentUser?.email, SUPPORT_LIMITS.email).toLowerCase();
    const type = clean(body?.type, 40).toLowerCase();
    const subject = clean(body?.subject, SUPPORT_LIMITS.subject);
    const message = clean(body?.message, SUPPORT_LIMITS.message);
    const website = clean(body?.website, 200);

    if (website) {
      return response({ success: true, message: "Solicitarea a fost înregistrată." }, 201);
    }
    if (!name || name.length > SUPPORT_LIMITS.name) {
      return response({ success: false, message: "Introdu numele tău." }, 400);
    }
    if (!EMAIL_PATTERN.test(email) || email.length > SUPPORT_LIMITS.email) {
      return response({ success: false, message: "Introdu o adresă de email validă." }, 400);
    }
    if (!isSupportRequestType(type)) {
      return response({ success: false, message: "Selectează un tip valid de solicitare." }, 400);
    }
    if (subject.length < 5 || subject.length > SUPPORT_LIMITS.subject) {
      return response({ success: false, message: "Subiectul trebuie să aibă între 5 și 160 de caractere." }, 400);
    }
    if (message.length < 20 || message.length > SUPPORT_LIMITS.message) {
      return response({ success: false, message: "Mesajul trebuie să aibă între 20 și 5000 de caractere." }, 400);
    }

    const clientIp = getRequestClientIp(request);
    const turnstile = await verifyTurnstile({
      token: body?.turnstileToken,
      remoteIp: clientIp,
      action: "support",
    });
    if (!turnstile.success) {
      return response(
        {
          success: false,
          code: "SECURITY_CHECK_FAILED",
          message: "Verificarea de securitate a expirat sau nu a reușit. Încearcă din nou.",
        },
        400
      );
    }

    const limits = await Promise.all([
      consumeAuthRateLimit({ action: "support:ip-hour", identifier: clientIp, limit: 8, windowSeconds: 3600 }),
      consumeAuthRateLimit({ action: "support:email-day", identifier: email, limit: 5, windowSeconds: 86400 }),
    ]);
    const blocked = limits.find((item) => !item.allowed);
    if (blocked) {
      return response(
        { success: false, message: "Ai trimis prea multe solicitări. Încearcă din nou mai târziu." },
        429,
        { "Retry-After": String(blocked.retryAfterSeconds) }
      );
    }

    const collection = await getSupportRequestsCollection();
    await ensureIndexes(collection);
    const now = new Date();
    const supportRequest = {
      reference: createReference(),
      type,
      name,
      email,
      subject,
      message,
      userId: currentUser?._id || null,
      username: currentUser?.username || "",
      status: "new",
      emailNotification: "scheduled",
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(supportRequest);

    after(async () => {
      try {
        await sendSupportRequestNotification(supportRequest);
        await collection.updateOne(
          { _id: result.insertedId },
          { $set: { emailNotification: "sent", emailSentAt: new Date(), updatedAt: new Date() } }
        );
      } catch (error) {
        console.error("Support notification email failed:", { reference: supportRequest.reference, error });
        await collection.updateOne(
          { _id: result.insertedId },
          { $set: { emailNotification: "failed", updatedAt: new Date() } }
        ).catch(() => {});
      }
    });

    return response(
      {
        success: true,
        message: "Solicitarea a fost trimisă. Păstrează numărul de referință.",
        reference: supportRequest.reference,
      },
      201
    );
  } catch (error) {
    console.error("POST /api/support error:", error);
    return response({ success: false, message: "Solicitarea nu a putut fi trimisă momentan." }, 500);
  }
}
