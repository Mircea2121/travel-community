import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

import { getUsersCollection } from "../../../utils/database";
import { EMAIL_PATTERN } from "../../../utils/validation";
import { createToken } from "../../../utils/auth";

export async function POST(request) {
  try {
    const body = await request.json();

    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return Response.json(
        {
          success: false,
          message: "Emailul și parola sunt obligatorii.",
        },
        {
          status: 400,
        }
      );
    }

    if (!EMAIL_PATTERN.test(email)) {
      return Response.json(
        {
          success: false,
          message: "Adresa de email nu este validă.",
        },
        {
          status: 400,
        }
      );
    }

    const usersCollection = await getUsersCollection();

    const user = await usersCollection.findOne({
      email,
    });

    if (!user) {
      return Response.json(
        {
          success: false,
          message: "Emailul sau parola sunt incorecte.",
        },
        {
          status: 401,
        }
      );
    }

    const passwordIsCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordIsCorrect) {
      return Response.json(
        {
          success: false,
          message: "Emailul sau parola sunt incorecte.",
        },
        {
          status: 401,
        }
      );
    }

    const token = await createToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const cookieStore = await cookies();

    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return Response.json(
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
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Eroare la autentificare:", error);

    return Response.json(
      {
        success: false,
        message: "A apărut o eroare la autentificare.",
      },
      {
        status: 500,
      }
    );
  }
}