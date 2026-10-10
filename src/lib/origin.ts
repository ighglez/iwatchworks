import type { NextRequest } from "next/server";

/** Rechaza peticiones POST de otros orígenes (protección CSRF para rutas API). */
export function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return true; // navegadores siempre lo envían en fetch POST; peticiones sin él no llevan cookies cross-site
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}
