const SIGNATURES = [
  {
    mimeType: "image/jpeg",
    matches: (buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
  },
  {
    mimeType: "image/png",
    matches: (buffer) =>
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      ),
  },
  {
    mimeType: "image/webp",
    matches: (buffer) =>
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP",
  },
];

export async function readVerifiedImage(file, { maxBytes } = {}) {
  if (!(file instanceof File) || file.size <= 0) {
    throw new TypeError("Fișierul imagine lipsește.");
  }

  if (Number.isSafeInteger(maxBytes) && file.size > maxBytes) {
    throw new RangeError("Fișierul imagine depășește limita permisă.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = SIGNATURES.find((signature) => signature.matches(buffer));

  if (!detected) {
    throw new TypeError("Conținutul fișierului nu este o imagine acceptată.");
  }

  const declaredType = file.type === "image/jpg" ? "image/jpeg" : file.type;

  if (declaredType && declaredType !== detected.mimeType) {
    throw new TypeError("Extensia imaginii nu corespunde conținutului.");
  }

  return {
    buffer,
    mimeType: detected.mimeType,
  };
}

export async function fileToBase64(file, options = {}) {
  const { buffer, mimeType } = await readVerifiedImage(file, options);
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

