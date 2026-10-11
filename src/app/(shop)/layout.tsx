import { CartProvider } from "@/components/cart/CartProvider";
import CartDrawer from "@/components/cart/CartDrawer";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WelcomePopup from "@/components/layout/WelcomePopup";
import CookieNotice from "@/components/layout/CookieNotice";
import { getCurrentUser, welcomeEligible } from "@/lib/auth";
import { paymentMethod } from "@/lib/payments";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const viewer = user
    ? { loggedIn: true, name: user.name, points: user.points, welcomeEligible: await welcomeEligible(user.id) }
    : { loggedIn: false, points: 0, welcomeEligible: false };

  return (
    <CartProvider viewer={viewer}>
      <a href="#contenido" className="sr-only z-[60] bg-ink px-4 py-2 text-ivory focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Saltar al contenido</a>
      <Header isAdmin={user?.role === "ADMIN"} />
      <main id="contenido" className="min-h-[60vh]">{children}</main>
      <Footer />
      <CartDrawer />
      <WelcomePopup />
      <CookieNotice />
      {paymentMethod() === "demo" && (
        <p className="pointer-events-none fixed bottom-3 right-3 z-20 rounded-full bg-amber-100/95 px-3 py-1.5 text-[11px] font-medium text-amber-900 shadow-sm">
          Modo prueba · pagos simulados
        </p>
      )}
    </CartProvider>
  );
}
