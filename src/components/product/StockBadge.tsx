export default function StockBadge({ stock, threshold, className = "" }: { stock: number; threshold: number; className?: string }) {
  const base = `inline-flex items-center gap-2 text-sm ${className}`;
  if (stock <= 0) return <span className={`${base} text-ink-muted`}><span className="h-2 w-2 rounded-full bg-ink-muted" /> Agotado temporalmente</span>;
  if (stock <= threshold)
    return <span className={`${base} text-gold-dark`}><span className="h-2 w-2 rounded-full bg-gold" /> {stock === 1 ? "Última unidad disponible" : `Últimas ${stock} unidades`}</span>;
  return <span className={`${base} text-emerald-700`}><span className="h-2 w-2 rounded-full bg-emerald-500" /> Disponible, sale en 24 h</span>;
}
