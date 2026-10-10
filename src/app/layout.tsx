import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "IWatchWorks · Relojes automáticos japoneses", template: "%s · IWatchWorks" },
  description:
    "Distribuidor independiente de relojes automáticos japoneses. Autenticidad garantizada, envío asegurado gratuito y factura en cada pedido.",
  openGraph: { type: "website", locale: "es_ES", siteName: "IWatchWorks", images: ["/og-image.jpg"] },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = { themeColor: "#C6A664" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
