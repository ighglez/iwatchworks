import Link from "next/link";
import type { PublicProduct } from "@/lib/product";
import { euros } from "@/lib/money";
import WatchImage from "../WatchImage";
import QuickAdd from "./QuickAdd";

export default function ProductCard({ product, priority = false }: { product: PublicProduct; priority?: boolean }) {
  const soldOut = product.stock <= 0;
  const low = !soldOut && product.stock <= product.lowStockThreshold;
  return (
    <article className="group relative">
      <Link href={`/producto/${product.slug}`} className="block overflow-hidden rounded-3xl bg-stone">
        <div className="relative aspect-[4/5]">
          <WatchImage
            src={product.images[0]}
            art={product.artwork}
            alt={`${product.brand} ${product.name} ${product.reference}`}
            eager={priority}
            className="absolute inset-0 h-full w-full transition duration-700 ease-out group-hover:scale-[1.035]"
          />
          {(low || soldOut) && (
            <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-medium ${soldOut ? "bg-white/80 text-ink-soft" : "bg-white/90 text-gold-dark"}`}>
              {soldOut ? "Agotado" : product.stock === 1 ? "Última unidad" : `Últimas ${product.stock}`}
            </span>
          )}
        </div>
      </Link>
      <div className="flex items-start justify-between gap-4 px-1 pt-5">
        <Link href={`/producto/${product.slug}`} className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-luxe text-gold-dark">{product.brand}</p>
          <h3 className="mt-1.5 text-lg font-semibold leading-snug">{product.name}</h3>
          <p className="mt-0.5 text-sm text-ink-muted">{product.reference}</p>
          <p className="mt-2 text-[15px] tabular-nums">{euros(product.price)}</p>
        </Link>
        {!soldOut && <QuickAdd product={product} />}
      </div>
    </article>
  );
}
