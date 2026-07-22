import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();

    cookieStore.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0),
      path: "/",
    });

    return Response.json(
      {
        success: true,
        message: "Te-ai delogat cu succes.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Eroare la delogare:", error);

    return Response.json(
      {
        success: false,
        message: "A apărut o eroare la delogare.",
      },
      {
        status: 500,
      }
    );
  }
}