import path from "path";

/** Carpeta de fotos antiguas guardadas en disco (solo servidores propios; en Vercel se usa la base de datos). */
export function uploadDir() {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");
}

export const IMAGE_TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" };
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

/** Comprueba la firma real del archivo (no fiarse del tipo declarado) y devuelve su extensión. */
export function imageExt(buf: Buffer): string | null {
  const hex = buf.subarray(0, 4).toString("hex");
  if (hex.startsWith("ffd8ff")) return "jpg";
  if (hex === "89504e47") return "png";
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "webp";
  if (/^ftypavi[fs]/.test(buf.subarray(4, 12).toString())) return "avif";
  return null;
}

/** URLs de imagen aceptadas: fotos subidas aquí o cualquier enlace https. */
export function isImageUrl(s: string) {
  return /^\/uploads\/[\w-]+\.(jpg|png|webp|avif)$/.test(s) || /^https:\/\/[^\s"'<>]+$/.test(s);
}
