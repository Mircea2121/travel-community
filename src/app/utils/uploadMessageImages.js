import { randomUUID } from "node:crypto";

import {
  deleteImage,
  uploadImage,
} from "./cloudinary";

import { fileToBase64 } from "./image";

export const MESSAGE_IMAGES = {
  MAX_COUNT: 5,
  MAX_SIZE: 8 * 1024 * 1024,

  ALLOWED_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ],
};

export function getMessageImageFiles(
  formData
) {
  if (!formData) {
    return [];
  }

  return formData
    .getAll("images")
    .filter(
      (image) =>
        image instanceof File &&
        image.size > 0
    );
}

export function validateMessageImages(
  images
) {
  if (!Array.isArray(images)) {
    return "Imaginile trimise nu sunt valide.";
  }

  if (
    images.length >
    MESSAGE_IMAGES.MAX_COUNT
  ) {
    return `Poți trimite maximum ${MESSAGE_IMAGES.MAX_COUNT} imagini într-un singur mesaj.`;
  }

  for (const image of images) {
    if (
      !MESSAGE_IMAGES.ALLOWED_TYPES.includes(
        image.type
      )
    ) {
      return "Sunt acceptate doar imagini JPG, PNG sau WEBP.";
    }

    if (
      image.size >
      MESSAGE_IMAGES.MAX_SIZE
    ) {
      return "Fiecare imagine trebuie să aibă maximum 8 MB.";
    }
  }

  return null;
}

export async function uploadMessageImages({
  images,
  userId,
  conversationId,
}) {
  if (
    !Array.isArray(images) ||
    images.length === 0
  ) {
    return [];
  }

  const uploadedImages = [];

  try {
    for (const image of images) {
      const base64Image =
        await fileToBase64(image);

      const publicId =
        `travel-community/messages/${conversationId}/${userId}/${randomUUID()}`;

      const uploadResult =
        await uploadImage(
          base64Image,
          publicId
        );

      uploadedImages.push({
        url:
          uploadResult.secure_url,

        publicId:
          uploadResult.public_id,

        width:
          Number(
            uploadResult.width
          ) || null,

        height:
          Number(
            uploadResult.height
          ) || null,

        format:
          uploadResult.format ||
          "",

        bytes:
          Number(
            uploadResult.bytes
          ) || image.size,

        originalName:
          image.name || "",

        createdAt:
          new Date(),
      });
    }

    return uploadedImages;
  } catch (error) {
    await deleteMessageImages(
      uploadedImages
    );

    throw error;
  }
}

export async function deleteMessageImages(
  images
) {
  if (
    !Array.isArray(images) ||
    images.length === 0
  ) {
    return;
  }

  await Promise.allSettled(
    images
      .filter(
        (image) =>
          typeof image?.publicId ===
            "string" &&
          image.publicId.trim()
      )
      .map((image) =>
        deleteImage(
          image.publicId
        )
      )
  );
}