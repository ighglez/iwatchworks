import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x py-24 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-4 text-5xl">Esta página no existe</h1>
      <p className="mt-4 text-ink-soft">Puede que el reloj ya no esté disponible o que el enlace haya cambiado.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/tienda" className="btn-primary">Ver la colección</Link>
        <Link href="/" className="btn-outline">Inicio</Link>
      </div>
    </div>
  );
}
