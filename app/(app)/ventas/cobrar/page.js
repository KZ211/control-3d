import { cargar } from '@/lib/datos';
import { plata, fecha, hace, whatsapp } from '@/lib/formato';
import Icono from '@/components/iconos';
import { Pagina, Vacio } from '@/components/ui';
import { cobrar } from '@/app/acciones';
import { Renglones, FormCobro, Cobrado } from '../partes';

export const dynamic = 'force-dynamic';

export default async function TeDeben() {
  const d = await cargar();
  const pendientes = d.entregadas.filter((v) => v.saldo > 0);
  const deben = pendientes.reduce((s, v) => s + v.saldo, 0);
  const vendido = d.entregadas.reduce((s, v) => s + v.total, 0);

  return (
    <Pagina>
      <p className="tarjeta flex flex-wrap items-baseline gap-x-6 gap-y-1 px-4 py-3 text-sm">
        <span>
          te deben <strong className={`text-2xl ${deben ? 'text-pierde' : ''}`}>{plata(deben)}</strong>
        </span>
        {pendientes.length > 0 && (
          <span>
            en {pendientes.length} {pendientes.length === 1 ? 'venta' : 'ventas'} · {vendido ? Math.round((deben / vendido) * 100) : 0}% de lo vendido
          </span>
        )}
      </p>
      {pendientes.length === 0 ? (
        <Vacio>Nadie te debe nada.</Vacio>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {pendientes.map((v) => {
            const escribir = whatsapp(
              v.cliente?.contacto,
              `Hola ${v.cliente?.nombre ?? ''}! Te escribo por ${v.detalle || 'tu pedido'}: me quedó pendiente ${plata(v.saldo)}. ¿Cuándo te queda bien pasarlo?`
            );
            return (
              <li key={v.id} className="tarjeta flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{v.cliente?.nombre ?? 'Sin cliente'}</p>
                    <p className="text-xs text-tenue">
                      Vendida el {fecha(v.fecha)} · {hace(v.fecha)}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-pierde">{plata(v.saldo)}</p>
                </div>
                <Renglones venta={v} />
                <Cobrado venta={v} />
                <div className="mt-auto space-y-2 border-t border-linea pt-3">
                  <FormCobro venta={v} accion={cobrar.bind(null, v.id)} boton="Cobré" />
                  {escribir && (
                    <a href={escribir} target="_blank" rel="noreferrer" className="boton-suave min-h-11 w-full">
                      <Icono nombre="mensaje" className="h-4 w-4" /> Escribirle por WhatsApp
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Pagina>
  );
}
