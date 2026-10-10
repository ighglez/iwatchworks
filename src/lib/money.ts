const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export function euros(cents: number) {
  return fmt.format(cents / 100);
}

export function centsFromEuroInput(value: string) {
  const n = Number(String(value).replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}
