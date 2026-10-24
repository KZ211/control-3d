import { plata } from '@/lib/formato';
import Enlace from './enlace';
import Icono from './iconos';

// El cuerpo de una pestaña.
export function Pagina({ children, className = '' }) {
  return <div className={`mx-auto w-full max-w-7xl space-y-4 p-4 md:p-6 ${className}`}>{children}</div>;
}

// Un bloque con título chico y, si hace falta, una acción a la derecha.
export function Seccion({ titulo, accion, children, className = '' }) {
  return (
    <section className={className}>
      {(titulo || accion) && (
        <div className="mb-2 flex min-h-9 flex-wrap items-center justify-between gap-3">
          {titulo && <h2 className="rotulo">{titulo}</h2>}
          {accion}
        </div>
      )}
      {children}
    </section>
  );
}

export function Hoja({ children, className = '' }) {
  return <div className={`tarjeta p-4 ${className}`}>{children}</div>;
}

const COLOR = { gana: 'text-gana', pierde: 'text-pierde' };

// Una cifra con su nombre y una nota.
export function Cifra({ nombre, valor, nota, tono, grande }) {
  return (
    <div>
      <p className="text-sm text-tenue">{nombre}</p>
      <p className={`mt-0.5 font-bold tracking-tight ${grande ? 'text-4xl md:text-5xl' : 'text-2xl'} ${COLOR[tono] ?? ''}`}>{valor}</p>
      {nota && <p className="mt-0.5 text-xs text-tenue">{nota}</p>}
    </div>
  );
}

// Una tarjeta de número: nombre, cifra y cómo viene comparada.
export function Dato({ nombre, valor, nota, tono, cambio, className = '' }) {
  return (
    <div className={`tarjeta flex flex-col p-4 ${className}`}>
      <p className="text-sm text-tenue">{nombre}</p>
      <p className={`mt-1 whitespace-nowrap text-2xl font-bold tracking-tight 2xl:text-3xl ${COLOR[tono] ?? ''}`}>{valor}</p>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-tenue">
        {cambio != null && Number.isFinite(cambio) && (
          <span className={`font-semibold ${cambio >= 0 ? 'text-gana' : 'text-pierde'}`}>
            {cambio >= 0 ? '▲' : '▼'} {Math.abs(Math.round(cambio * 100))}%
          </span>
        )}
        {nota}
      </p>
    </div>
  );
}

export const tonoDe = (v) => (v > 0 ? 'gana' : v < 0 ? 'pierde' : undefined);

// Explicación plegable de un concepto.
export function Explica({ titulo = '¿Qué significa?', children }) {
  return (
    <details className="group mt-3 border-t border-linea pt-2 text-sm">
      <summary className="cursor-pointer select-none py-1 font-medium text-primary">{titulo}</summary>
      <div className="mt-1 max-w-2xl space-y-2 leading-relaxed text-tenue">{children}</div>
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
  return <p className="rounded-box border border-dashed border-linea p-6 text-center text-sm text-tenue">{children}</p>;
}

// Barra de avance (0 a 1).
export function Avance({ valor, etiqueta, tono = 'gana' }) {
  const v = Math.max(0, Math.min(1, valor || 0));
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-linea" role="img" aria-label={etiqueta}>
      <div className={`crece-x h-full rounded-full ${tono === 'acento' ? 'bg-acento' : 'bg-gana'}`} style={{ width: `${v * 100}%` }} />
    </div>
  );
}

// Fila de un estado de cuenta: concepto y monto, con signo.
export function Renglon({ concepto, monto, fuerte, nota }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 py-1.5 text-sm ${fuerte ? 'border-t-2 border-tinta font-bold' : 'border-b border-linea'}`}>
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

// Lista con detalle: en pantallas anchas el detalle va a la derecha; en las angostas lo tapa todo.
// Con `abierto` en falso, el costado es solo un extra de desktop.
export function ConDetalle({ lista, detalle, abierto = true }) {
  return (
    <div className={`grid h-full min-h-0 gap-4 ${detalle ? 'xl:grid-cols-[minmax(0,1fr)_24rem]' : ''}`}>
      <div className={`min-h-0 ${detalle && abierto ? 'hidden xl:block' : ''}`}>{lista}</div>
      {detalle && <aside className={`min-h-0 ${abierto ? '' : 'hidden xl:block'}`}>{detalle}</aside>}
    </div>
  );
}

// El panel de detalle de un elemento, con su botón para cerrarlo.
export function PanelDetalle({ titulo, subtitulo, cerrar, children }) {
  return (
    <div className="tarjeta flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-linea p-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold">{titulo}</h2>
          {subtitulo && <p className="text-xs text-tenue">{subtitulo}</p>}
        </div>
        <Enlace href={cerrar} className="btn btn-ghost btn-square h-11 min-h-11 w-11" aria-label="Cerrar">
          <Icono nombre="cerrar" />
        </Enlace>
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">{children}</div>
    </div>
  );
}

// Una tabla dentro de una tarjeta, con el encabezado fijo al desplazar.
export function Tabla({ children, className = '' }) {
  return (
    <div className={`tarjeta min-h-0 overflow-auto ${className}`}>
      <table className="tabla">{children}</table>
    </div>
  );
}
