import { randomUUID } from "node:crypto";

import { getUsersCollection } from "./database";
import { uploadImage, deleteImage } from "./cloudinary";
import { fileToBase64 } from "./image";
import { IMAGE } from "./validation";

const FIELD_OPTIONS = Object.freeze({
  avatar: {
    width: 1200,
    height: 1200,
    crop: "limit",
  },
  coverImage: {
    width: 2400,
    height: 1200,
    crop: "limit",
  },
});

export async function uploadUserImage({ user, file, field }) {
  const fieldOptions = FIELD_OPTIONS[field];

  if (!fieldOptions) {
    throw new TypeError("Tipul imaginii de profil nu este acceptat.");
  }

  const image = await fileToBase64(file, {
    maxBytes: IMAGE.MAX_SIZE,
  });
  const oldPublicId = user[field]?.publicId || null;
  const newPublicId = `users/${user._id}/${field}/${randomUUID()}`;
  const result = await uploadImage(image, newPublicId, {
    transformation: [
      {
        ...fieldOptions,
        quality: "auto:good",
        fetch_format: "auto",
      },
    ],
  });

  const usersCollection = await getUsersCollection();

  try {
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          [field]: {
            url: result.secure_url,
            publicId: result.public_id,
            width: Number(result.width) || null,
            height: Number(result.height) || null,
          },
          updatedAt: new Date(),
        },
      }
    );
  } catch (error) {
    await deleteImage(result.public_id).catch(() => {});
    throw error;
  }

  if (oldPublicId && oldPublicId !== result.public_id) {
    await deleteImage(oldPublicId).catch((error) => {
      console.error("Old profile image cleanup failed:", error);
    });
  }

  return usersCollection.findOne(
    { _id: user._id },
    { projection: { password: 0 } }
  );
}

