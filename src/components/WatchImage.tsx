"use client";

import { useEffect, useRef, useState } from "react";

const CDN_W = /\/upload\/f_auto,q_auto,w_\d+\//;
const sized = (src: string, w: number) => src.replace(CDN_W, `/upload/f_auto,q_auto,w_${w}/`);

/** Imagen de producto con respaldo elegante si no hay foto o falla la carga. */
export default function WatchImage({
  src,
  alt,
  className = "",
  eager = false,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  eager?: boolean;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // Si la imagen falló antes de hidratar, onError no llega a dispararse.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, [src]);
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-b from-white to-ivory-dark ${className}`} role="img" aria-label={alt}>
        <svg viewBox="0 0 120 160" className="h-3/5 w-auto text-gold" fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x="42" y="4" width="36" height="34" rx="4" />
          <rect x="42" y="122" width="36" height="34" rx="4" />
          <circle cx="60" cy="80" r="42" fill="white" />
          <circle cx="60" cy="80" r="34" />
          <path d="M60 80V56M60 80l16 9" strokeWidth="2" strokeLinecap="round" />
          <circle cx="60" cy="80" r="2.5" fill="currentColor" />
          <rect x="102" y="76" width="6" height="8" rx="1" />
        </svg>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      srcSet={CDN_W.test(src) ? [200, 400, 800, 1200, 1600].map((w) => `${sized(src, w)} ${w}w`).join(", ") : undefined}
      sizes={CDN_W.test(src) ? sizes : undefined}
      alt={alt}
      fetchPriority={eager ? "high" : undefined}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
