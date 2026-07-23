import { getUsersCollection } from "./database";
import { uploadImage, deleteImage } from "./cloudinary";
import { fileToBase64 } from "./image";

export async function uploadUserImage({
  user,
  file,
  field,
}) {
  const image = await fileToBase64(file);

  if (user[field]?.publicId) {
    await deleteImage(user[field].publicId);
  }

  const result = await uploadImage(
    image,
    `users/${user._id}/${field}`
  );

  const usersCollection = await getUsersCollection();

  await usersCollection.updateOne(
    {
      _id: user._id,
    },
    {
      $set: {
        [field]: {
          url: result.secure_url,
          publicId: result.public_id,
        },
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

  return updatedUser;
}