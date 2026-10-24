import VentaRapida from '@/components/venta-rapida';
import { cargar, paraVender } from '@/lib/datos';
import { hoy } from '@/lib/formato';

export const dynamic = 'force-dynamic';

// La pestaña principal de Ventas: la carga rápida ocupando toda la pantalla.
// Comparte el borrador con la ventana de "+ Venta".
export default async function NuevaVenta() {
  const d = await cargar();
  return (
    <div className="mx-auto h-full w-full max-w-7xl md:p-6">
      <div data-venta-pagina className="h-full overflow-hidden bg-hoja md:rounded-box md:border md:border-linea">
        <VentaRapida hoy={hoy()} {...paraVender(d)} enfocar="auto" borrador />
      </div>
    </div>
  );
}
