import { readFile } from "fs/promises";
import path from "path";
import { uploadDir } from "@/lib/uploads";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" };

export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  // Solo nombres generados por nosotros: evita path traversal
  const m = /^[\w-]+\.(jpg|png|webp|avif)$/.exec(file);
  if (!m) return new Response("Not found", { status: 404 });
  try {
    const buf = await readFile(path.join(uploadDir(), file));
    return new Response(new Uint8Array(buf), {
      headers: { "Content-Type": TYPES[m[1]], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
