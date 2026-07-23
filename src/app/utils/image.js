export async function fileToBase64(file) {
  const bytes = await file.arrayBuffer();

  const buffer = Buffer.from(bytes);

  const mimeType = file.type;

  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}