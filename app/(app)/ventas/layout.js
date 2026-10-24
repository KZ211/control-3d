import { Marco } from '@/components/seccion';
import { cargar } from '@/lib/datos';

// Las pestañas de ventas muestran cuántos encargos y deudas hay pendientes.
export default async function Layout({ children }) {
  const d = await cargar();
  const insignias = {
    '/ventas/encargos': d.encargos.length,
    '/ventas/cobrar': d.entregadas.filter((v) => v.saldo > 0).length,
  };
  return <Marco insignias={insignias}>{children}</Marco>;
}
