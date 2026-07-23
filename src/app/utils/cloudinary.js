import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export async function uploadImage(
  file,
  publicId
) {
  return cloudinary.uploader.upload(file, {
    public_id: publicId,
    resource_type: "image",
    overwrite: true,
  });
}

export async function deleteImage(publicId) {
  if (!publicId) {
    return;
  }

  return cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
}