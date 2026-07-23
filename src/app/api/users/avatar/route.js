import { NextResponse } from "next/server";

import { getCurrentUser } from "../../../utils/currentUser";
import { uploadUserImage } from "../../../utils/uploadUserImage";
import { IMAGE } from "../../../utils/validation";

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

    const formData = await request.formData();

    const file = formData.get("avatar");

    if (!file || file.size === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Nu ai selectat nicio imagine.",
        },
        {
          status: 400,
        }
      );
    }

    if (!IMAGE.ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Formatul imaginii nu este acceptat.",
        },
        {
          status: 400,
        }
      );
    }

    if (file.size > IMAGE.MAX_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: `Imaginea poate avea maximum ${
            IMAGE.MAX_SIZE / 1024 / 1024
          } MB.`,
        },
        {
          status: 400,
        }
      );
    }

    const updatedUser = await uploadUserImage({
      user,
      file,
      field: "avatar",
    });

    return NextResponse.json({
      success: true,
      message: "Avatar actualizat cu succes.",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);

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