'use client';

import { useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

// Un desplegable que filtra la lista cambiando un parámetro de la dirección.
export default function Filtro({ parametro, etiqueta, opciones, todos }) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();
  const [cargando, iniciar] = useTransition();

  const cambiar = (valor) => {
    const nuevos = new URLSearchParams(params);
    if (valor) nuevos.set(parametro, valor);
    else nuevos.delete(parametro);
    nuevos.delete('v');
    iniciar(() => router.push(`${ruta}${nuevos.size ? `?${nuevos}` : ''}`));
  };

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">{etiqueta}</span>
      <select value={params.get(parametro) ?? ''} onChange={(e) => cambiar(e.target.value)} className="entrada min-h-11 w-auto max-w-56 py-0 text-sm">
        <option value="">{todos}</option>
        {opciones.map(([v, n]) => (
          <option key={v} value={v}>
            {n}
          </option>
        ))}
      </select>
      {cargando && <span className="barra-carga fixed inset-x-0 top-0 z-50 h-0.5 bg-acento" aria-hidden="true" />}
    </label>
  );
}
