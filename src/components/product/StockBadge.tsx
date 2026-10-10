export default function StockBadge({ stock, threshold, className = "" }: { stock: number; threshold: number; className?: string }) {
  if (stock <= 0) return <span className={`text-xs text-ink-muted ${className}`}>Agotado · Consultar disponibilidad</span>;
  if (stock <= threshold)
    return (
      <span className={`flex items-center gap-1.5 text-xs text-amber-700 ${className}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {stock === 1 ? "Última unidad" : `Últimas ${stock} unidades`}
      </span>
    );
  return (
    <span className={`flex items-center gap-1.5 text-xs text-emerald-700 ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> En stock · envío en 24 h
    </span>
  );
}
