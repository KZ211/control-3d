import { plata } from '@/lib/formato';

export function Pagina({ titulo, bajada, children }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 md:px-8">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{titulo}</h1>
      {bajada && <p className="mt-2 max-w-2xl text-tenue">{bajada}</p>}
      <div className="mt-8 space-y-10">{children}</div>
    </div>
  );
}

export function Seccion({ titulo, accion, children, className = '' }) {
  return (
    <section className={className}>
      {(titulo || accion) && (
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          {titulo && <h2 className="text-xl font-semibold tracking-tight">{titulo}</h2>}
          {accion}
        </div>
      )}
      {children}
    </section>
  );
}

export function Hoja({ children, className = '' }) {
  return <div className={`border border-linea bg-hoja p-4 md:p-6 ${className}`}>{children}</div>;
}

// Una cifra grande con su nombre y una nota.
export function Cifra({ nombre, valor, nota, tono, grande }) {
  const color = tono === 'gana' ? 'text-gana' : tono === 'pierde' ? 'text-pierde' : '';
  return (
    <div>
      <p className="text-sm text-tenue">{nombre}</p>
      <p className={`mt-1 font-bold tracking-tight ${grande ? 'text-4xl md:text-5xl' : 'text-2xl'} ${color}`}>{valor}</p>
      {nota && <p className="mt-1 text-sm text-tenue">{nota}</p>}
    </div>
  );
}

export const tonoDe = (v) => (v > 0 ? 'gana' : v < 0 ? 'pierde' : undefined);

// Explicación plegable de un concepto.
export function Explica({ titulo = '¿Qué significa?', children }) {
  return (
    <details className="group mt-4 border-t border-linea pt-3 text-sm">
      <summary className="cursor-pointer select-none font-medium text-acento">{titulo}</summary>
      <div className="mt-2 max-w-2xl space-y-2 leading-relaxed text-tenue">{children}</div>
    </details>
  );
}

export function Campo({ nombre, ayuda, children, className = '' }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block font-medium">{nombre}</span>
      {children}
      {ayuda && <span className="mt-1 block text-xs text-tenue">{ayuda}</span>}
    </label>
  );
}

export function Vacio({ children }) {
  return <p className="border border-dashed border-linea p-6 text-center text-sm text-tenue">{children}</p>;
}

// Barra de avance (0 a 1).
export function Avance({ valor, etiqueta }) {
  const v = Math.max(0, Math.min(1, valor || 0));
  return (
    <div>
      <div className="h-3 w-full bg-linea" role="img" aria-label={etiqueta}>
        <div className="h-3 bg-gana" style={{ width: `${v * 100}%` }} />
      </div>
    </div>
  );
}

// Fila de un estado de cuenta: concepto y monto, con signo.
export function Renglon({ concepto, monto, fuerte, nota }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-2 ${fuerte ? 'border-t-2 border-tinta font-bold' : 'border-b border-linea'}`}>
      <span>
        {concepto}
        {nota && <span className="block text-xs font-normal text-tenue">{nota}</span>}
      </span>
      <span className={`shrink-0 ${monto < 0 ? 'text-pierde' : ''}`}>
        {monto < 0 ? '− ' : ''}
        {plata(Math.abs(monto))}
      </span>
    </div>
  );
}
