"use client";

import { useEffect, useRef, useState } from "react";
import { uploadProductImage } from "@/app/actions/admin";

const MAX_SIDE = 2000;

/** Reduce la foto en el navegador para que suba rápido y quepa en el límite del hosting. */
async function shrink(file: File): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) throw new Error(`"${file.name}" no es una imagen JPG, PNG, WEBP o AVIF.`);
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file);
  } catch {
    if (file.size <= 3 * 1024 * 1024) return file;
    throw new Error(`No se ha podido leer "${file.name}".`);
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  const toBlob = (type: string, q: number) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, q));
  for (const q of [0.86, 0.75, 0.6]) {
    let blob = await toBlob("image/webp", q);
    if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg", q);
    if (blob && blob.size <= 2.8 * 1024 * 1024) return blob;
  }
  throw new Error(`"${file.name}" es demasiado pesada incluso reducida.`);
}

export default function ImageManager({ initial, onBusy }: { initial: string[]; onBusy?: (busy: boolean) => void }) {
  const [images, setImages] = useState(initial);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => onBusy?.(busy > 0), [busy, onBusy]);

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    for (const file of Array.from(files)) {
      setBusy((n) => n + 1);
      try {
        const blob = await shrink(file);
        const fd = new FormData();
        fd.append("file", blob, file.name);
        const res = await uploadProductImage(fd);
        if (res.error) throw new Error(res.error);
        setImages((xs) => [...xs, res.url!]);
      } catch (e) {
        setError((e as Error).message || "No se ha podido subir la foto.");
      } finally {
        setBusy((n) => n - 1);
      }
    }
    if (input.current) input.current.value = "";
  }

  function addLink() {
    const url = link.trim();
    if (!/^https:\/\/\S+$/.test(url)) return setError("Pega un enlace que empiece por https://");
    setError(null);
    setImages((xs) => (xs.includes(url) ? xs : [...xs, url]));
    setLink("");
  }

  const move = (i: number, d: number) =>
    setImages((xs) => {
      const j = i + d;
      if (j < 0 || j >= xs.length) return xs;
      const c = [...xs];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  return (
    <div>
      <p className="label">Fotos <span className="normal-case tracking-normal text-ink-muted">(la primera es la principal)</span></p>
      <input type="hidden" name="images" value={images.join("\n")} />

      <div className="flex flex-wrap gap-3">
        {images.map((src, i) => (
          <div key={src} className="group relative h-28 w-28 overflow-hidden rounded-xl border border-line bg-stone">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
            {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-gold px-2 py-0.5 text-[10px] font-medium text-white">Principal</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-white/90 px-1 py-0.5 text-xs">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="px-1.5 disabled:opacity-30" aria-label="Mover a la izquierda">←</button>
              <button type="button" onClick={() => setImages((xs) => xs.filter((x) => x !== src))} className="px-1.5 text-rose-700" aria-label="Quitar foto">Quitar</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="px-1.5 disabled:opacity-30" aria-label="Mover a la derecha">→</button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
          className="flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ink/25 text-xs text-ink-soft transition hover:border-gold hover:text-gold"
        >
          {busy > 0 ? <>Subiendo…</> : <><span className="text-2xl leading-none">+</span>Añadir fotos</>}
        </button>
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />

      <div className="mt-3 flex gap-2">
        <input value={link} onChange={(e) => setLink(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }} placeholder="…o pega el enlace de una foto (https://…)" className="input py-2.5 text-sm" />
        <button type="button" onClick={addLink} className="btn-outline shrink-0 px-5 py-2.5">Añadir</button>
      </div>
      {error && <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    </div>
  );
}
