import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import clientPromise from "../../../utils/mongodb";
import { verifyToken } from "../../../utils/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return Response.json(
        {
          success: false,
          message: "Nu ești autentificat.",
        },
        {
          status: 401,
        }
      );
    }

    const payload = await verifyToken(token);

    const client = await clientPromise;
    const database = client.db("travel-community");
    const usersCollection = database.collection("users");

    const user = await usersCollection.findOne(
      {
        _id: new ObjectId(payload.userId),
      },
      {
        projection: {
          password: 0,
        },
      }
    );

    if (!user) {
      return Response.json(
        {
          success: false,
          message: "Utilizatorul nu a fost găsit.",
        },
        {
          status: 404,
        }
      );
    }

    return Response.json(
      {
        success: true,
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
    console.error("Eroare la verificarea sesiunii:", error);

    return Response.json(
      {
        success: false,
        message: "Sesiunea nu este validă sau a expirat.",
      },
      {
        status: 401,
      }
    );
  }
}