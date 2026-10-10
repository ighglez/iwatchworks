# IWatchWorks · tienda online

Tienda de relojes con la estética de iwatchworks.com (dorado `#C6A664` sobre marfil `#F9F9F7`, tipografías Cormorant Garamond + Inter), carrito lateral, "Comprar ya", registro opcional con 5% de bienvenida y puntos, y panel de administración.

## Tecnología
- **Next.js 15** (App Router, server actions) + **React 19** + **Tailwind CSS**
- **Prisma** + **PostgreSQL** (Neon en Vercel)
- **Stripe Checkout** para cobrar (tarjeta, Apple Pay, Google Pay). Sin claves, funciona una pasarela de demostración.

## Arrancar en local
```bash
npm install
cp .env.example .env        # pon DATABASE_URL (PostgreSQL) y una ADMIN_PASSWORD
npm run setup               # crea la base de datos y carga los 4 relojes + el admin
npm run dev                 # http://localhost:3000
```
Admin: `http://localhost:3000/admin` con `ADMIN_EMAIL` / `ADMIN_PASSWORD` del `.env`.

## Publicar en Vercel (enlace de prueba)
1. En vercel.com → **Add New → Project** → importa el repositorio `iwatchworks`.
2. Antes de pulsar Deploy, en **Environment Variables** añade:
   - `ADMIN_EMAIL` y `ADMIN_PASSWORD` (mín. 10 caracteres): tu acceso al panel.
   - `DEMO_PAYMENTS` = `true` (pagos simulados hasta conectar Stripe).
3. Pulsa **Deploy**. Fallará por falta de base de datos: es normal.
4. En el proyecto → **Storage → Create Database → Neon (Postgres)** → conéctala al proyecto (rellena `DATABASE_URL` sola).
5. **Deployments → ⋯ → Redeploy**. El build crea las tablas y carga los relojes y el admin.

Cada despliegue sincroniza la base de datos (`npm run vercel-build`). Las fotos se gestionan con enlaces de Cloudinary, porque Vercel no guarda archivos subidos.

## Activar Stripe (modo prueba)
1. En dashboard.stripe.com (modo prueba) copia la clave `sk_test_…` a `STRIPE_SECRET_KEY`.
2. Crea un webhook a `https://TU-DOMINIO/api/stripe/webhook` con los eventos `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` y `charge.refunded`. Copia el `whsec_…` a `STRIPE_WEBHOOK_SECRET`.
3. En local: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
4. Tarjeta de prueba: `4242 4242 4242 4242`.

Las claves `sk_live_` están bloqueadas hasta definir `ALLOW_LIVE_PAYMENTS=true`. Pon `DEMO_PAYMENTS="false"` antes de publicar.

## Antes de publicar
- Datos fiscales: `LEGAL_COMPANY`, `LEGAL_TAX_ID`, `LEGAL_ADDRESS` (salen en facturas y textos legales). Revisa los textos de `/legal/*` con tu asesor.
- Precios: los del seed son de ejemplo; cámbialos en Admin → Productos.
- Emails: crea una cuenta en Resend y pon `RESEND_API_KEY` y `EMAIL_FROM`.
- Catálogo PDF: coloca `public/catalogo-2025.pdf` y aparecerá el botón de descarga.
- WhatsApp: `NEXT_PUBLIC_WHATSAPP`.
- Fotos subidas desde el admin se guardan en `UPLOAD_DIR` (por defecto `./data/uploads`); en hosting sin disco persistente usa URLs de Cloudinary.

## Reglas comerciales
Todas en `src/lib/config.ts` (`RULES`): 5% primera compra con cuenta, 1 punto por euro, 100 puntos = 5 €, máximo 30% del pedido con puntos, envío gratis, reserva de stock de 30 min mientras se paga.

## Seguridad
- Precios, descuentos y stock se calculan siempre en el servidor; el stock se reserva de forma atómica (no se puede vender dos veces la última unidad).
- Contraseñas con bcrypt (coste 12), sesiones en cookie `httpOnly` + `SameSite=Lax` con token aleatorio guardado como hash; cambiar/restablecer contraseña cierra las demás sesiones.
- Límite de intentos en login, registro, contacto, checkout y seguimiento.
- Admin protegido en middleware + comprobación de rol en cada página y acción.
- Pedidos y facturas solo accesibles con enlace secreto, siendo su dueño o admin.
- Webhook de Stripe con verificación de firma; nunca se guardan datos de tarjeta.
- Cabeceras CSP, HSTS, X-Frame-Options, nosniff; subidas validadas por firma real del archivo.
- `npm audit --omit=dev`: 0 vulnerabilidades.
