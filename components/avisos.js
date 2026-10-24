'use client';

import { useEffect, useState } from 'react';
import Icono from './iconos';

// Un aviso corto abajo de la pantalla, desde cualquier componente:
// avisar({ texto, deshacer }) — `deshacer` es una función async opcional.
export const avisar = (aviso) => window.dispatchEvent(new CustomEvent('aviso', { detail: aviso }));

export default function Avisos() {
  const [aviso, setAviso] = useState(null);
  const [deshaciendo, setDeshaciendo] = useState(false);

  useEffect(() => {
    const mostrar = (e) => setAviso({ ...e.detail, n: Date.now() });
    window.addEventListener('aviso', mostrar);
    return () => window.removeEventListener('aviso', mostrar);
  }, []);
  // Con "Deshacer" queda más tiempo a la vista.
  useEffect(() => {
    if (!aviso || deshaciendo) return;
    const t = setTimeout(() => setAviso(null), aviso.deshacer ? 8000 : 5000);
    return () => clearTimeout(t);
  }, [aviso, deshaciendo]);

  const deshacer = async () => {
    setDeshaciendo(true);
    const r = await aviso.deshacer();
    setDeshaciendo(false);
    setAviso(r?.error ? { texto: `No se pudo deshacer: ${r.error}`, n: Date.now() } : { texto: 'Listo, lo deshice.', n: Date.now() });
  };

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex justify-center px-4 md:bottom-6">
      {aviso && (
        <p role="status" className="pointer-events-auto flex items-center gap-3 rounded-box bg-tinta py-1 pl-4 pr-1 text-sm font-medium text-papel shadow-lg">
          <Icono nombre="listo" className="h-4 w-4" />
          <span className="py-2">{aviso.texto}</span>
          {aviso.deshacer ? (
            <button
              type="button"
              onClick={deshacer}
              disabled={deshaciendo}
              className="btn btn-ghost btn-sm min-h-11 text-papel underline underline-offset-2 hover:bg-papel/10"
            >
              {deshaciendo ? 'Deshaciendo…' : 'Deshacer'}
            </button>
          ) : (
            <span className="w-3" />
          )}
        </p>
      )}
    </div>
  );
}
