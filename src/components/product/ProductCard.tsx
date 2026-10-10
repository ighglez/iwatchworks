import Link from "next/link";
import type { PublicProduct } from "@/lib/product";
import { euros } from "@/lib/money";
import WatchImage from "../WatchImage";
import AddToCartButton from "./AddToCartButton";
import StockBadge from "./StockBadge";

export default function ProductCard({ product }: { product: PublicProduct }) {
  return (
    <article className="group flex flex-col bg-white transition hover:shadow-soft">
      <Link href={`/producto/${product.slug}`} className="relative block aspect-square overflow-hidden bg-white">
        <WatchImage src={product.images[0]} alt={`${product.brand} ${product.name} ${product.reference}`} className="h-full w-full transition duration-700 group-hover:scale-[1.04]" />
        {product.compareAtPrice && product.compareAtPrice > product.price && (
          <span className="absolute left-3 top-3 bg-gold px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink">Oferta</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="eyebrow">{product.brand}</p>
        <Link href={`/producto/${product.slug}`} className="mt-1 font-serif text-2xl leading-tight hover:text-gold-dark">
          {product.name}
        </Link>
        <p className="mt-1 text-xs text-ink-muted">Ref. {product.reference}</p>
        <div className="mt-4 flex items-end justify-between gap-2">
          <div>
            <p className="text-lg font-medium tabular-nums">{euros(product.price)}</p>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <p className="text-xs text-ink-muted line-through">{euros(product.compareAtPrice)}</p>
            )}
          </div>
          <StockBadge stock={product.stock} threshold={product.lowStockThreshold} />
        </div>
        <div className="mt-5">
          <AddToCartButton product={product} />
        </div>
      </div>
    </article>
  );
}
