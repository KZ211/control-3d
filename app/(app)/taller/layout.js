import { Marco } from '@/components/seccion';
import { cargarBambu } from '@/lib/datos';

// La pestaña "Por revisar" muestra cuántas impresiones de Bambu Lab faltan clasificar.
export default async function Layout({ children }) {
  const b = await cargarBambu().catch(() => null);
  const pendientes = b?.impresiones.filter((i) => i.decision === 'pendiente').length ?? 0;
  return <Marco insignias={{ '/taller/bambu': pendientes }}>{children}</Marco>;
}
