import { NextResponse, type NextRequest } from "next/server";

// Primera barrera: sin cookie de sesión no se entra al admin ni a la cuenta.
// La comprobación real de rol se hace en el servidor en cada página y acción.
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has("iw_session");
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/iniciar-sesion";
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/cuenta/:path*"] };
