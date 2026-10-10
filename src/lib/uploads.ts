import path from "path";

/** Carpeta persistente para fotos subidas desde el admin (fuera de /public para que funcione tras el build). */
export function uploadDir() {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");
}
