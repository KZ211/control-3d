import { cargar } from '@/lib/datos';
import { hoy } from '@/lib/formato';
import { Pagina, Hoja, Explica } from '@/components/ui';
import FormCompra from './form';

export const dynamic = 'force-dynamic';

export default async function NuevaCompra() {
  const d = await cargar();
  const maquinas = d.maquinas.map(({ id, nombre }) => ({ id, nombre }));

  return (
    <Pagina className="max-w-5xl">
      <Hoja className="p-5">
        <FormCompra hoy={hoy()} maquinas={maquinas} />
        <Explica titulo="¿Caja, bolsillo o cuotas?">
          <p>
            <strong>De la caja:</strong> la pagaste con plata que generaron las ventas. Baja la caja.
          </p>
          <p>
            <strong>De tu bolsillo:</strong> la pagaste con tu plata (por ejemplo, la liquidación). Suma a lo que querés recuperar.
          </p>
          <p>
            <strong>En cuotas:</strong> es una deuda. Cada cuota que pagás la registrás en Cuotas y elegís si salió de la caja o de tu bolsillo.
          </p>
        </Explica>
      </Hoja>
    </Pagina>
  );
}
