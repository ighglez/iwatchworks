"use client";

import { useState } from "react";
import WatchImage from "../WatchImage";

export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  return (
    <div>
      <div className="aspect-square overflow-hidden border border-line bg-white">
        <WatchImage key={images[i]} src={images[i]} alt={alt} eager sizes="(min-width: 1024px) 50vw, 100vw" className="h-full w-full animate-fade-in" />
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-3">
          {images.map((src, idx) => (
            <button key={src} onClick={() => setI(idx)} className={`aspect-square overflow-hidden border bg-white ${idx === i ? "border-gold" : "border-line"}`} aria-label={`Imagen ${idx + 1}`}>
              <WatchImage src={src} alt="" sizes="100px" className="h-full w-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
