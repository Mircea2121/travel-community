import { NextResponse } from "next/server";

import { getCurrentUser } from "@/app/utils/currentUser";

import {
  uploadMessageImages,
  validateMessageImages,
  getMessageImageFiles,
} from "@/app/utils/uploadMessageImages";

export async function POST(request) {
  try {
    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Trebuie să fii autentificat.",
        },
        {
          status: 401,
        }
      );
    }

    const formData =
      await request.formData();

    const conversationId =
      String(
        formData.get(
          "conversationId"
        ) || ""
      ).trim();

    if (!conversationId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Conversația este invalidă.",
        },
        {
          status: 400,
        }
      );
    }

    const images =
      getMessageImageFiles(
        formData
      );

    const validationError =
      validateMessageImages(
        images
      );

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          message:
            validationError,
        },
        {
          status: 400,
        }
      );
    }

    const uploadedImages =
      await uploadMessageImages({
        images,
        userId:
          currentUser._id.toString(),
        conversationId,
      });

    return NextResponse.json({
      success: true,
      images: uploadedImages,
    });
  } catch (error) {
    console.error(
      "Upload message images:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Imaginile nu au putut fi încărcate.",
      },
      {
        status: 500,
      }
    );
  }
}