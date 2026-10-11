"use client";

import { useState } from "react";
import WatchImage from "../WatchImage";

export default function Gallery({ images, art, alt }: { images: string[]; art?: string; alt: string }) {
  const [i, setI] = useState(0);
  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-stone">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_55%_at_50%_45%,rgba(255,255,255,0.9),transparent_75%)]" aria-hidden="true" />
        <WatchImage key={images[i] ?? "art"} src={images[i]} art={art} alt={alt} eager fit={images.length ? "cover" : "contain"} sizes="(min-width: 1024px) 55vw, 100vw" className="relative h-full w-full animate-fade-in" />
      </div>
      {images.length > 1 && (
        <div className="mt-4 flex gap-3">
          {images.map((src, idx) => (
            <button key={src} onClick={() => setI(idx)} className={`h-20 w-20 overflow-hidden rounded-2xl bg-stone ring-2 ring-offset-2 ring-offset-ivory transition ${idx === i ? "ring-gold" : "ring-transparent"}`} aria-label={`Ver imagen ${idx + 1}`}>
              <WatchImage src={src} alt="" sizes="100px" className="h-full w-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
