import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

import { getUsersCollection } from "../../../utils/database";
import { EMAIL_PATTERN } from "../../../utils/validation";
import {
  createToken,
  getAuthVersion,
} from "../../../utils/auth";

export const runtime = "nodejs";

function jsonResponse(body, status) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function POST(request) {
  try {
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

    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    const password =
      typeof body?.password === "string"
        ? body.password
        : "";

    if (!email || !password) {
      return jsonResponse(
        {
          success: false,
          message: "Emailul și parola sunt obligatorii.",
        },
        400
      );
    }

    if (
      email.length > 254 ||
      !EMAIL_PATTERN.test(email)
    ) {
      return jsonResponse(
        {
          success: false,
          message: "Adresa de email nu este validă.",
        },
        400
      );
    }

    if (password.length > 256) {
      return jsonResponse(
        {
          success: false,
          message: "Emailul sau parola sunt incorecte.",
        },
        401
      );
    }

    const usersCollection = await getUsersCollection();
    const user = await usersCollection.findOne(
      {
        email,
      },
      {
        projection: {
          _id: 1,
          name: 1,
          username: 1,
          email: 1,
          password: 1,
          role: 1,
          authVersion: 1,
        },
      }
    );

    if (!user?.password) {
      return jsonResponse(
        {
          success: false,
          message: "Emailul sau parola sunt incorecte.",
        },
        401
      );
    }

    const passwordIsCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordIsCorrect) {
      return jsonResponse(
        {
          success: false,
          message: "Emailul sau parola sunt incorecte.",
        },
        401
      );
    }

    const token = await createToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      authVersion: getAuthVersion(user),
    });

    const cookieStore = await cookies();

    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return jsonResponse(
      {
        success: true,
        message: "Autentificarea a fost realizată cu succes.",
        user: {
          id: user._id.toString(),
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
      200
    );
  } catch (error) {
    console.error("Eroare la autentificare:", error);

    return jsonResponse(
      {
        success: false,
        message: "A apărut o eroare la autentificare.",
      },
      500
    );
  }
}
