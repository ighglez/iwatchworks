"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-serif text-4xl">Algo no ha ido bien</h1>
      <p className="mt-4 text-ink-soft">No se ha realizado ningún cargo. Vuelve a intentarlo; si continúa, escríbenos y te ayudamos.</p>
      <button onClick={reset} className="btn-primary mt-8">Reintentar</button>
    </div>
  );
}
