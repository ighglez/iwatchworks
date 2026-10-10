"use client";

import { startTransition } from "react";

/** Formulario que envía con server actions sin vaciar los campos si hay un error. */
export default function Form({ action, ...rest }: Omit<React.FormHTMLAttributes<HTMLFormElement>, "action"> & { action: (fd: FormData) => void }) {
  return (
    <form
      {...rest}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    />
  );
}
