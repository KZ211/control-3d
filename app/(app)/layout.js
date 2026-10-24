import { Suspense } from 'react';
import { BarraLateral, BarraInferior } from '@/components/navegacion';
import DialogoVenta from '@/components/dialogo-venta';
import Avisos from '@/components/avisos';
import { cargar, paraVender } from '@/lib/datos';
import { hoy } from '@/lib/formato';

// La ventana de venta rápida trae sus datos aparte, para no frenar la pantalla.
async function Venta() {
  const d = await cargar();
  return <DialogoVenta hoy={hoy()} {...paraVender(d)} />;
}

// Toda la app entra en el alto de la pantalla: menú al costado (o abajo en
// el celular) y cada sección con su encabezado fijo.
export default function AppLayout({ children }) {
  return (
    <div className="flex h-dvh overflow-hidden">
      <BarraLateral />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        <BarraInferior />
      </div>
      <Suspense fallback={null}>
        <Venta />
      </Suspense>
      <Avisos />
    </div>
  );
}
