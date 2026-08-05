export const MESSAGE_IMAGE_POLICY = Object.freeze({
  MAX_COUNT: 5,
  MAX_SIZE_BYTES: 8 * 1024 * 1024,
  ACCEPT_ATTRIBUTE: "image/jpeg,image/png,image/webp",
  ALLOWED_TYPES: Object.freeze([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]),
});

export function validateMessageImageFiles(files, existingCount = 0) {
  const normalizedFiles = Array.from(files || []);
  const currentCount = Number.isInteger(existingCount)
    ? Math.max(existingCount, 0)
    : 0;

  if (
    currentCount + normalizedFiles.length >
    MESSAGE_IMAGE_POLICY.MAX_COUNT
  ) {
    return {
      validFiles: [],
      error: `Poți trimite maximum ${MESSAGE_IMAGE_POLICY.MAX_COUNT} imagini într-un singur mesaj.`,
    };
  }

  for (const file of normalizedFiles) {
    if (!(file instanceof File)) {
      return {
        validFiles: [],
        error: "Una dintre imaginile selectate nu este validă.",
      };
    }

    if (!MESSAGE_IMAGE_POLICY.ALLOWED_TYPES.includes(file.type)) {
      return {
        validFiles: [],
        error: "Sunt acceptate numai imagini JPG, PNG sau WEBP.",
      };
    }

    if (file.size <= 0) {
      return {
        validFiles: [],
        error: "Una dintre imaginile selectate este goală.",
      };
    }

    if (file.size > MESSAGE_IMAGE_POLICY.MAX_SIZE_BYTES) {
      return {
        validFiles: [],
        error: "Fiecare imagine poate avea maximum 8 MB.",
      };
    }
  }

  return {
    validFiles: normalizedFiles,
    error: "",
  };
}
