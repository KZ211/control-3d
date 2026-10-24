'use client';

import { useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

// Formulario que llama a una acción del servidor, muestra su error y se
// vacía cuando sale bien. `confirmar` pide confirmación antes de enviar: un
// texto fijo, o una función que mira el formulario y devuelve el texto (o nada).
// `alTerminar` recibe lo que devolvió la acción.
export function Formulario({ accion, children, className = '', confirmar, alTerminar, limpiar = true, claseError = 'mt-3 basis-full px-1 pb-2', onKeyDown }) {
  const ref = useRef(null);
  const [error, setError] = useState(null);

  return (
    <form
      ref={ref}
      className={className}
      onKeyDown={onKeyDown}
      onSubmit={(e) => {
        const pregunta = typeof confirmar === 'function' ? confirmar(e.currentTarget) : confirmar;
        if (pregunta && !window.confirm(pregunta)) e.preventDefault();
      }}
      action={async (fd) => {
        setError(null);
        const r = await accion(fd);
        if (r?.error) {
          setError(r.error);
          return;
        }
        if (limpiar) ref.current?.reset();
        alTerminar?.(r);
      }}
    >
      {children}
      {error && (
        <p role="alert" className={`text-sm font-medium text-pierde ${claseError}`}>
          {error}
        </p>
      )}
    </form>
  );
}

export function Enviar({ children, className = 'boton', deshabilitado = false, etiqueta }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || deshabilitado} className={className} aria-label={etiqueta}>
      {pending && <span className="loading loading-spinner loading-sm" aria-hidden="true" />}
      {pending ? 'Guardando…' : children}
    </button>
  );
}

// Un botón suelto que ejecuta una acción (borrar, marcar…).
// `etiqueta` nombra el botón cuando solo tiene un ícono.
export function Accion({ accion, confirmar, children, className = 'boton-suave', etiqueta }) {
  return (
    <Formulario accion={accion} confirmar={confirmar} limpiar={false} className="inline">
      <Enviar className={className} etiqueta={etiqueta}>
        {children}
      </Enviar>
    </Formulario>
  );
}
