import { CartProvider } from "@/components/cart/CartProvider";
import CartDrawer from "@/components/cart/CartDrawer";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WelcomePopup from "@/components/layout/WelcomePopup";
import CookieNotice from "@/components/layout/CookieNotice";
import { getCurrentUser, welcomeEligible } from "@/lib/auth";
import { demoPaymentsEnabled } from "@/lib/stripe";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const viewer = user
    ? { loggedIn: true, name: user.name, points: user.points, welcomeEligible: await welcomeEligible(user.id) }
    : { loggedIn: false, points: 0, welcomeEligible: false };

  return (
    <CartProvider viewer={viewer}>
      <a href="#contenido" className="sr-only z-[60] bg-ink px-4 py-2 text-ivory focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Saltar al contenido</a>
      {demoPaymentsEnabled() && (
        <p className="bg-amber-100 py-1.5 text-center text-[11px] text-amber-900">Versión de prueba: los pagos son simulados y no se cobra nada.</p>
      )}
      <Header isAdmin={user?.role === "ADMIN"} />
      <main id="contenido" className="min-h-[60vh]">{children}</main>
      <Footer />
      <CartDrawer />
      <WelcomePopup />
      <CookieNotice />
    </CartProvider>
  );
}
