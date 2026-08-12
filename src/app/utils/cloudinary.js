import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

export async function uploadImage(file, publicId, options = {}) {
  return cloudinary.uploader.upload(file, {
    public_id: publicId,
    resource_type: "image",
    overwrite: true,
    invalidate: true,
    type: "upload",
    access_mode: "public",
    flags: "strip_profile",
    ...options,
  });
}

export async function deleteImage(publicId) {
  if (typeof publicId !== "string" || !publicId.trim()) {
    return;
  }

  return cloudinary.uploader.destroy(publicId.trim(), {
    resource_type: "image",
    invalidate: true,
  });
}

