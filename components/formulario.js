'use client';

import { useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

// Formulario que llama a una acción del servidor, muestra su error y se
// vacía cuando sale bien. `confirmar` pide confirmación antes de enviar.
export function Formulario({ accion, children, className = '', confirmar, alTerminar, limpiar = true }) {
  const ref = useRef(null);
  const [error, setError] = useState(null);

  return (
    <form
      ref={ref}
      className={className}
      onSubmit={(e) => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault();
      }}
      action={async (fd) => {
        setError(null);
        const r = await accion(fd);
        if (r?.error) {
          setError(r.error);
          return;
        }
        if (limpiar) ref.current?.reset();
        alTerminar?.();
      }}
    >
      {children}
      {error && (
        <p role="alert" className="mt-3 basis-full text-sm font-medium text-pierde">
          {error}
        </p>
      )}
    </form>
  );
}

export function Enviar({ children, className = 'boton' }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? 'Guardando…' : children}
    </button>
  );
}

// Un botón suelto que ejecuta una acción (borrar, marcar…).
export function Accion({ accion, confirmar, children, className = 'boton-suave' }) {
  return (
    <Formulario accion={accion} confirmar={confirmar} limpiar={false} className="inline">
      <Enviar className={className}>{children}</Enviar>
    </Formulario>
  );
}
