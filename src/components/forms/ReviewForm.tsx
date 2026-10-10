"use client";

import Form from "@/components/forms/Form";
import { useActionState, useState } from "react";
import { submitReview } from "@/app/actions/order";
import { StarIcon } from "../icons";

export default function ReviewForm({ order, token }: { order: string; token: string }) {
  const [state, action, pending] = useActionState(submitReview, null);
  const [rating, setRating] = useState(5);
  if (state?.ok) return <p className="card p-6 text-sm">¡Gracias por tu opinión! La publicaremos tras revisarla.</p>;
  return (
    <Form action={action} className="card space-y-4 p-6">
      <h2 className="text-2xl">¿Qué te ha parecido?</h2>
      <input type="hidden" name="order" value={order} />
      <input type="hidden" name="t" value={token} />
      <input type="hidden" name="rating" value={rating} />
      <div className="flex gap-1 text-gold" role="radiogroup" aria-label="Puntuación">
        {[1, 2, 3, 4, 5].map((i) => (
          <button type="button" key={i} onClick={() => setRating(i)} role="radio" aria-checked={rating === i} aria-label={`${i} estrellas`}>
            <StarIcon className="h-7 w-7" filled={i <= rating} />
          </button>
        ))}
      </div>
      <textarea name="text" rows={3} required minLength={10} maxLength={1000} className="input resize-none" placeholder="Cuéntanos tu experiencia con el reloj y con nosotros" aria-label="Tu opinión" />
      {state?.error && <p className="text-sm text-rose-700">{state.error}</p>}
      <button disabled={pending} className="btn-primary">Enviar opinión</button>
    </Form>
  );
}
