import bcrypt from "bcryptjs";
import clientPromise from "../../../utils/mongodb";
import { cookies } from "next/headers";
import { createToken } from "../../../utils/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

    const client = await clientPromise;
    const database = client.db("travel-community");
    const usersCollection = database.collection("users");

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