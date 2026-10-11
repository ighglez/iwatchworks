import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { quote } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/auth";
import { sameOrigin } from "@/lib/origin";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  items: z.array(z.object({ productId: z.string().max(40), quantity: z.number().int().min(1).max(5) })).max(30),
  usePoints: z.boolean().optional(),
  welcome: z.boolean().optional(),
  code: z.string().max(40).optional(),
  email: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getCurrentUser();
  // Limita los intentos de adivinar códigos de descuento.
  if (parsed.data.code && !(await rateLimit(`code:${await clientIp()}`, 40, 600))) {
    return NextResponse.json({ error: "Demasiados intentos con códigos. Espera unos minutos." }, { status: 429 });
  }
  const q = await quote(parsed.data.items, {
    userId: user?.id,
    usePoints: parsed.data.usePoints,
    welcome: !user && parsed.data.welcome,
    code: parsed.data.code,
    email: parsed.data.email?.trim().toLowerCase() || null,
  });
  return NextResponse.json(q, { headers: { "Cache-Control": "no-store" } });
}
