import { NextResponse } from "next/server";

import { getCurrentUser } from "../../../utils/currentUser";
import { getUsersCollection } from "../../../utils/database";
import {
  NAME,
  BIO,
  LOCATION,
} from "../../../utils/validation";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Nu ești autentificat.",
        },
        {
          status: 401,
        }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "A apărut o eroare.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Nu ești autentificat.",
        },
        {
          status: 401,
        }
      );
    }

    const body = await request.json();

    const name = body.name?.trim();
    const bio = body.bio?.trim() || "";
    const location = body.location?.trim() || "";

    if (
      !name ||
      name.length < NAME.MIN_LENGTH ||
      name.length > NAME.MAX_LENGTH
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Numele trebuie să conțină între ${NAME.MIN_LENGTH} și ${NAME.MAX_LENGTH} caractere.`,
        },
        {
          status: 400,
        }
      );
    }

    if (bio.length > BIO.MAX_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Descrierea poate avea maximum ${BIO.MAX_LENGTH} caractere.`,
        },
        {
          status: 400,
        }
      );
    }

    if (location.length > LOCATION.MAX_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          message: `Locația poate avea maximum ${LOCATION.MAX_LENGTH} caractere.`,
        },
        {
          status: 400,
        }
      );
    }

    const usersCollection = await getUsersCollection();

    await usersCollection.updateOne(
      {
        _id: user._id,
      },
      {
        $set: {
          name,
          bio,
          location,
          updatedAt: new Date(),
        },
      }
    );

    const updatedUser = await usersCollection.findOne(
      {
        _id: user._id,
      },
      {
        projection: {
          password: 0,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Profil actualizat cu succes.",
      user: updatedUser,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "A apărut o eroare.",
      },
      {
        status: 500,
      }
    );
  }
}