import { cargar } from '@/lib/datos';
import { plata, fecha, hace, whatsapp } from '@/lib/formato';
import Icono from '@/components/iconos';
import { Pagina, Vacio } from '@/components/ui';
import { Pendiente, CobroRapido } from '@/components/pendientes';
import { Renglones, Cobrado, paraCobrar } from '../partes';

export const dynamic = 'force-dynamic';

// Lo que te deben, de la deuda más vieja a la más nueva: una fila por venta y "Cobrar".
export default async function TeDeben() {
  const d = await cargar();
  const pendientes = d.entregadas.filter((v) => v.saldo > 0).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const deben = pendientes.reduce((s, v) => s + v.saldo, 0);
  const vendido = d.entregadas.reduce((s, v) => s + v.total, 0);

  return (
    <Pagina className="!max-w-4xl">
      <p className="text-sm text-tenue">
        <strong className={`text-base ${deben ? 'text-pierde' : 'text-tinta'}`}>Te deben {plata(deben)}</strong>
        {pendientes.length > 0 && (
          <>
            {' '}
            · en {pendientes.length} {pendientes.length === 1 ? 'venta' : 'ventas'} · {vendido ? Math.round((deben / vendido) * 100) : 0}% de lo vendido
          </>
        )}
      </p>
      {pendientes.length === 0 ? (
        <Vacio>Nadie te debe nada.</Vacio>
      ) : (
        <ul className="tarjeta divide-y divide-linea">
          {pendientes.map((v) => {
            const escribir = whatsapp(
              v.cliente?.contacto,
              `Hola ${v.cliente?.nombre ?? ''}! Te escribo por ${v.detalle || 'tu pedido'}: me quedó pendiente ${plata(v.saldo)}. ¿Cuándo te queda bien pasarlo?`
            );
            return (
              <Pendiente
                key={v.id}
                titulo={v.cliente?.nombre ?? 'Sin cliente'}
                detalle={v.detalle}
                nota={`Vendida el ${fecha(v.fecha)} · ${hace(v.fecha)}`}
                monto={plata(v.saldo)}
                montoTono="text-pierde"
                boton="Cobrar"
              >
                <Renglones venta={v} />
                <Cobrado venta={v} />
                <CobroRapido venta={paraCobrar(v)} />
                {escribir && (
                  <a href={escribir} target="_blank" rel="noreferrer" className="btn btn-ghost min-h-11 w-full border border-linea">
                    <Icono nombre="mensaje" className="h-4 w-4" /> Escribirle por WhatsApp
                  </a>
                )}
              </Pendiente>
            );
          })}
        </ul>
      )}
    </Pagina>
  );
}
