import { BarraLateral, BarraInferior } from '@/components/navegacion';

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
    </div>
  );
}
