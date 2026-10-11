import { readFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { IMAGE_TYPES, uploadDir } from "@/lib/uploads";

const HEADERS = { "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" };

export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  // Solo nombres generados por nosotros: evita path traversal
  const m = /^([\w-]+)\.(jpg|png|webp|avif)$/.exec(file);
  if (!m) return new Response("Not found", { status: 404 });
  const img = await db.upload.findUnique({ where: { id: m[1] } });
  if (img) return new Response(new Uint8Array(img.data), { headers: { ...HEADERS, "Content-Type": img.mime } });
  try {
    const buf = await readFile(path.join(uploadDir(), file));
    return new Response(new Uint8Array(buf), { headers: { ...HEADERS, "Content-Type": IMAGE_TYPES[m[2]] } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
