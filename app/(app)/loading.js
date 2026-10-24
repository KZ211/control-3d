// Se muestra al instante al cambiar de pantalla, mientras se leen los datos.
// El menú queda fijo arriba; acá solo va la forma de la página.
export default function Cargando() {
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-6xl px-4 pb-24 pt-8 md:px-8">
      <span className="sr-only">Cargando…</span>
      <div className="barra-carga fixed inset-x-0 top-0 z-20 h-0.5 bg-acento" aria-hidden="true" />
      <div aria-hidden="true" className="animate-pulse motion-reduce:animate-none">
        <div className="h-9 w-48 bg-linea md:h-10" />
        <div className="mt-3 h-4 w-80 max-w-full bg-linea" />
        <div className="mt-8 border border-linea bg-hoja p-4 md:p-6">
          <div className="h-4 w-32 bg-linea" />
          <div className="mt-3 h-10 w-56 bg-linea" />
          <div className="mt-5 h-3 w-full bg-linea" />
        </div>
        <div className="mt-10 grid grid-cols-2 gap-px border border-linea bg-linea md:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-hoja p-4">
              <div className="h-3 w-20 bg-linea" />
              <div className="mt-3 h-7 w-28 bg-linea" />
            </div>
          ))}
        </div>
        <div className="mt-10 border border-linea bg-hoja">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between gap-4 border-b border-linea px-4 py-4 last:border-b-0">
              <div className="h-4 w-1/3 bg-linea" />
              <div className="h-4 w-20 bg-linea" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
