"use client";

import { useEffect, useRef, useState } from "react";
import WatchRender, { parseArtwork } from "./WatchRender";

const CDN_W = /\/upload\/f_auto,q_auto,w_\d+\//;
const sized = (src: string, w: number) => src.replace(CDN_W, `/upload/f_auto,q_auto,w_${w}/`);

/** Foto del producto o, si no hay, su ilustración de estudio. */
export default function WatchImage({
  src,
  alt,
  art,
  className = "",
  eager = false,
  fit = "cover",
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
}: {
  src?: string | null;
  alt: string;
  art?: string | null;
  className?: string;
  eager?: boolean;
  fit?: "cover" | "contain";
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
      <div className={`flex items-center justify-center ${className}`}>
        <WatchRender art={parseArtwork(art)} title={alt} className="h-[86%] w-auto drop-shadow-[0_30px_40px_rgba(0,0,0,0.18)]" />
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
      className={`${fit === "contain" ? "object-contain" : "object-cover"} ${className}`}
    />
  );
}
