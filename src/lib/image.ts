/**
 * Resize an image file to a square JPEG of `maxSize` px (cover/center crop),
 * returning a new File ready for upload.
 */
export async function resizeImageToSquareJpeg(
  file: File,
  maxSize = 512,
  quality = 0.85,
): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Arquivo não é uma imagem");
  }

  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = maxSize;
  canvas.height = maxSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, maxSize, maxSize);
  bitmap.close?.();

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Falha ao gerar imagem"))),
      "image/jpeg",
      quality,
    ),
  );

  return new File([blob], "avatar.jpg", { type: "image/jpeg" });
}