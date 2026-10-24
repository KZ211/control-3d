import { Pestanas } from './navegacion';

// El armazón de cada sección: encabezado con pestañas fijo y el contenido
// debajo, que es lo único que se desplaza si no entra.
export function Marco({ children, insignias }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Pestanas insignias={insignias} />
      <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
    </div>
  );
}

// Lo que se ve mientras llega una pestaña: el encabezado ya está, esto es el cuerpo.
export function Cargando() {
  return (
    <div role="status" aria-live="polite" className="mx-auto w-full max-w-7xl p-4 md:p-6">
      <span className="sr-only">Cargando…</span>
      <div className="barra-carga fixed inset-x-0 top-0 z-50 h-0.5 bg-acento" aria-hidden="true" />
      <div aria-hidden="true" className="grid animate-pulse gap-4 motion-reduce:animate-none lg:grid-cols-3">
        <div className="tarjeta h-48 lg:row-span-2 lg:h-auto" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="tarjeta h-24" />
        ))}
        <div className="tarjeta h-64 lg:col-span-2" />
        <div className="tarjeta h-64" />
      </div>
    </div>
  );
}
