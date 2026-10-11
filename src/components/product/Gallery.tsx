"use client";

import { useEffect, useRef, useState } from "react";
import WatchImage from "../WatchImage";

/** Galería de la ficha: se desliza con el dedo, con flechas discretas al pasar el ratón y un indicador mínimo. */
export default function Gallery({ images, art, alt }: { images: string[]; art?: string; alt: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const many = images.length > 1;

  useEffect(() => {
    const el = track.current;
    if (!el || !many) return;
    const on = () => setI(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", on, { passive: true });
    return () => el.removeEventListener("scroll", on);
  }, [many]);

  const go = (n: number) => {
    const el = track.current;
    if (!el) return;
    const next = Math.max(0, Math.min(images.length - 1, n));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  if (!many) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-stone">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_55%_at_50%_45%,rgba(255,255,255,0.9),transparent_75%)]" aria-hidden="true" />
        <WatchImage src={images[0]} art={art} alt={alt} eager fit={images.length ? "cover" : "contain"} sizes="(min-width: 1024px) 55vw, 100vw" className="relative h-full w-full animate-fade-in" />
      </div>
    );
  }

  return (
    <div
      className="group relative aspect-square overflow-hidden rounded-[2rem] bg-stone"
      role="region"
      aria-roledescription="carrusel"
      aria-label={`Fotos de ${alt}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); go(i + 1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); go(i - 1); }
      }}
    >
      <div ref={track} className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {images.map((src, idx) => (
          <div key={src} className="h-full w-full shrink-0 snap-center" aria-hidden={idx !== i}>
            <WatchImage src={src} alt={`${alt}, foto ${idx + 1} de ${images.length}`} eager={idx === 0} sizes="(min-width: 1024px) 55vw, 100vw" className="h-full w-full" />
          </div>
        ))}
      </div>

      {/* Flechas: solo con ratón, al pasar por encima */}
      <button
        type="button"
        onClick={() => go(i - 1)}
        disabled={i === 0}
        aria-label="Foto anterior"
        className="absolute left-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink opacity-0 backdrop-blur transition duration-300 hover:bg-white focus-visible:opacity-100 disabled:!opacity-0 group-hover:opacity-100 [@media(hover:hover)]:flex"
      >
        <Chevron dir="left" />
      </button>
      <button
        type="button"
        onClick={() => go(i + 1)}
        disabled={i === images.length - 1}
        aria-label="Foto siguiente"
        className="absolute right-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink opacity-0 backdrop-blur transition duration-300 hover:bg-white focus-visible:opacity-100 disabled:!opacity-0 group-hover:opacity-100 [@media(hover:hover)]:flex"
      >
        <Chevron dir="right" />
      </button>

      {/* Indicador: líneas finas */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-white/60 px-3 backdrop-blur-sm">
        {images.map((src, idx) => (
          <button
            key={src}
            type="button"
            onClick={() => go(idx)}
            aria-label={`Ver foto ${idx + 1}`}
            aria-current={idx === i}
            className="group/dot py-2"
          >
            <span className={`block h-[2px] rounded-full transition-all duration-300 ${idx === i ? "w-6 bg-ink/70" : "w-3 bg-ink/20 group-hover/dot:bg-ink/40"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
