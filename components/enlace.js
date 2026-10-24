'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

// Link que muestra la barra de carga mientras llega la pantalla nueva. Sirve
// para los cambios de ?mes= o ?cliente=, donde Next no muestra loading.js.
export default function Enlace({ href, children, ...props }) {
  const router = useRouter();
  const [cargando, iniciar] = useTransition();
  return (
    <>
      <a
        href={href}
        aria-busy={cargando || undefined}
        onClick={(e) => {
          // Ctrl/cmd + clic sigue abriendo en otra pestaña.
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          e.preventDefault();
          iniciar(() => router.push(href));
        }}
        {...props}
      >
        {children}
      </a>
      {cargando && <span className="barra-carga fixed inset-x-0 top-0 z-20 h-0.5 bg-acento" aria-hidden="true" />}
    </>
  );
}
