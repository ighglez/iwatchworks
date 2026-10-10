import Stripe from "stripe";

let client: Stripe | null = null;

export function stripeEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function demoPaymentsEnabled() {
  return !stripeEnabled() && process.env.DEMO_PAYMENTS === "true";
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe no está configurado");
  if (process.env.NODE_ENV === "production" && key.startsWith("sk_live") && process.env.ALLOW_LIVE_PAYMENTS !== "true") {
    throw new Error("Claves live bloqueadas: define ALLOW_LIVE_PAYMENTS=true cuando quieras cobrar de verdad.");
  }
  client ??= new Stripe(key);
  return client;
}
