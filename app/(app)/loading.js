import { Cargando } from '@/components/seccion';

// Al entrar a una sección: el encabezado todavía no está, así que va su forma.
export default function CargandoSeccion() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-linea bg-hoja" aria-hidden="true">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-6 px-4 py-3 md:px-6">
          <div className="h-6 w-24 animate-pulse rounded-btn bg-linea motion-reduce:animate-none" />
          <div className="hidden h-8 w-72 animate-pulse rounded-btn bg-linea motion-reduce:animate-none md:block" />
        </div>
      </div>
      <Cargando />
    </div>
  );
}
