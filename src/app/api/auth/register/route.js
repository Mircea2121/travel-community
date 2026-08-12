import bcrypt from "bcryptjs";

import { getUsersCollection } from "../../../utils/database";
import {
  EMAIL_PATTERN,
  NAME,
  RESERVED_USERNAMES,
  USERNAME_PATTERN,
  getPasswordValidation,
} from "../../../utils/validation";
import { consumeAuthRateLimit } from "../../../utils/authRateLimit";
import { getRequestClientIp } from "../../../utils/requestClient";
import { isTrustedMutationRequest } from "../../../utils/requestOrigin";
import {
  jsonResponse,
  rateLimitResponse,
} from "../../../utils/securityResponse";
import { verifyTurnstile } from "../../../utils/turnstile";
import { scheduleEmailVerification } from "../../../utils/scheduleEmailVerification";

export const runtime = "nodejs";

function duplicateUserResponse(error) {
  if (error?.code !== 11000) {
    return null;
  }

  if (error.keyPattern?.email) {
    return jsonResponse(
      {
        success: false,
        message: "Există deja un cont cu această adresă de email.",
      },
      409
    );
  }

  if (error.keyPattern?.username) {
    return jsonResponse(
      {
        success: false,
        message: "Acest nume de utilizator este deja folosit.",
      },
      409
    );
  }

  return jsonResponse(
    {
      success: false,
      message: "Există deja un cont cu aceste date.",
    },
    409
  );
}

export async function POST(request) {
  try {
    if (!isTrustedMutationRequest(request)) {
      return jsonResponse(
        {
          success: false,
          message: "Originea cererii nu este permisă.",
        },
        403
      );
    }

    const clientIp = getRequestClientIp(request);
    const rateLimit = await consumeAuthRateLimit({
      action: "register:ip",
      identifier: clientIp,
      limit: 8,
      windowSeconds: 60 * 60,
    });

    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit);
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        {
          success: false,
          message: "Cererea trimisă nu este validă.",
        },
        400
      );
    }

    const turnstile = await verifyTurnstile({
      token: body?.turnstileToken,
      remoteIp: clientIp,
      action: "register",
    });

    if (!turnstile.success) {
      return jsonResponse(
        {
          success: false,
          code: "SECURITY_CHECK_FAILED",
          message:
            "Verificarea de securitate a expirat sau nu a reușit. Încearcă din nou.",
        },
        400
      );
    }

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const username =
      typeof body?.username === "string"
        ? body.username.trim().toLowerCase()
        : "";
    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    const password =
      typeof body?.password === "string" ? body.password : "";

    if (!name || !username || !email || !password) {
      return jsonResponse(
        {
          success: false,
          message: "Toate câmpurile sunt obligatorii.",
        },
        400
      );
    }

    if (name.length < NAME.MIN_LENGTH || name.length > NAME.MAX_LENGTH) {
      return jsonResponse(
        {
          success: false,
          message: "Numele trebuie să conțină între 2 și 50 de caractere.",
        },
        400
      );
    }

    if (!USERNAME_PATTERN.test(username)) {
      return jsonResponse(
        {
          success: false,
          message:
            "Username-ul poate conține doar litere mici, cifre, punct și underscore și trebuie să aibă între 3 și 20 de caractere.",
        },
        400
      );
    }

    if (RESERVED_USERNAMES.includes(username)) {
      return jsonResponse(
        {
          success: false,
          message: "Acest username este rezervat.",
        },
        409
      );
    }

    if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
      return jsonResponse(
        {
          success: false,
          message: "Adresa de email nu este validă.",
        },
        400
      );
    }

    const passwordValidation = getPasswordValidation(password);

    if (!passwordValidation.isValid) {
      return jsonResponse(
        {
          success: false,
          message:
            "Parola trebuie să aibă între 8 și 64 de caractere, maximum 72 de octeți, o literă mare, o literă mică, o cifră și caracterul @.",
        },
        400
      );
    }

    const usersCollection = await getUsersCollection();
    const existingUser = await usersCollection.findOne(
      { $or: [{ email }, { username }] },
      { projection: { _id: 1, email: 1, username: 1 } }
    );

    if (existingUser?.email === email) {
      return jsonResponse(
        {
          success: false,
          message: "Există deja un cont cu această adresă de email.",
        },
        409
      );
    }

    if (existingUser?.username === username) {
      return jsonResponse(
        {
          success: false,
          message: "Acest nume de utilizator este deja folosit.",
        },
        409
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const now = new Date();
    const newUser = {
      name,
      username,
      email,
      password: hashedPassword,
      emailVerifiedAt: null,
      role: "user",
      authVersion: 0,
      passwordChangedAt: now,
      bio: "",
      location: "",
      avatar: null,
      coverImage: null,
      followers: [],
      following: [],
      stats: {
        postsCount: 0,
        destinationsCount: 0,
        likesReceived: 0,
        followersCount: 0,
        followingCount: 0,
        photosUploaded: 0,
      },
      level: {
        name: "Călător începător",
        number: 1,
        currentXp: 0,
        nextLevelXp: 500,
      },
      createdAt: now,
      updatedAt: now,
    };

    let result;

    try {
      result = await usersCollection.insertOne(newUser);
    } catch (error) {
      const duplicateResponse = duplicateUserResponse(error);

      if (duplicateResponse) {
        return duplicateResponse;
      }

      throw error;
    }

    scheduleEmailVerification({
      ...newUser,
      _id: result.insertedId,
    });

    return jsonResponse(
      {
        success: true,
        message:
          "Contul a fost creat. Verifică emailul pentru confirmarea adresei.",
        user: {
          id: result.insertedId.toString(),
          name,
          username,
          email,
          role: newUser.role,
          emailVerified: false,
        },
      },
      201
    );
  } catch (error) {
    console.error("Eroare la înregistrare:", error);
    return jsonResponse(
      {
        success: false,
        message: "A apărut o eroare la crearea contului.",
      },
      500
    );
  }
}
