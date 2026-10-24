import { cargar } from '@/lib/datos';
import { plata, fecha, hace, diasDesde } from '@/lib/formato';
import Icono from '@/components/iconos';
import { Pagina, Vacio } from '@/components/ui';
import { Accion } from '@/components/formulario';
import { borrar, entregar } from '@/app/acciones';
import { Renglones, FormCobro, Cobrado, paraEditar } from '../partes';
import { BotonEditar } from '@/components/dialogo-venta';

export const dynamic = 'force-dynamic';

export default async function Encargos() {
  const d = await cargar();
  const total = d.encargos.reduce((s, v) => s + v.total, 0);
  const senas = d.encargos.reduce((s, v) => s + v.cobrado, 0);

  return (
    <Pagina>
      <p className="tarjeta flex flex-wrap items-baseline gap-x-6 gap-y-1 px-4 py-3 text-sm">
        <span>
          <strong className="text-2xl">{d.encargos.length}</strong> {d.encargos.length === 1 ? 'encargo' : 'encargos'} por entregar
        </span>
        {total > 0 && (
          <span>
            valen <strong>{plata(total)}</strong>
          </span>
        )}
        {senas > 0 && (
          <span>
            ya cobraste <strong>{plata(senas)}</strong> en señas
          </span>
        )}
      </p>
      {d.encargos.length === 0 ? (
        <Vacio>No tenés encargos pendientes. Al cargar una venta, elegí “Encargo” si todavía falta hacerla o entregarla.</Vacio>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {d.encargos.map((v) => (
            <li key={v.id} className="tarjeta flex flex-col gap-3 p-4">
              <div className="-mr-2 -mt-2 flex items-start justify-between gap-2">
                <div className="pt-2">
                  <p className="font-semibold">{v.cliente?.nombre ?? 'Sin cliente'}</p>
                  <p className={`text-xs ${diasDesde(v.fecha) >= 21 ? 'font-medium text-warning' : 'text-tenue'}`}>
                    Pedido el {fecha(v.fecha)} · {hace(v.fecha)}
                  </p>
                </div>
                <Accion
                  accion={borrar.bind(null, 'ventas', v.id)}
                  confirmar={`¿Borrar el encargo de ${v.cliente?.nombre ?? 'sin cliente'}? También se borran sus señas.`}
                  className="btn btn-ghost btn-square h-11 min-h-11 w-11 text-tenue hover:text-pierde"
                  etiqueta={`Borrar el encargo de ${v.cliente?.nombre ?? 'sin cliente'}`}
                >
                  <Icono nombre="borrar" className="h-4 w-4" />
                </Accion>
              </div>
              <Renglones venta={v} />
              <Cobrado venta={v} />
              <div className="mt-auto space-y-2 border-t border-linea pt-3">
                {v.total === 0 && (
                  <BotonEditar edicion={paraEditar(v)} className="btn btn-primary min-h-11 w-full">
                    Ponerle precio
                  </BotonEditar>
                )}
                <FormCobro venta={v} accion={entregar.bind(null, v.id)} boton="Entregado" monto="Cobré al entregar" secundario={v.total === 0} />
              </div>
              {v.total > 0 && (
                <BotonEditar edicion={paraEditar(v)} className="boton-suave min-h-11 w-full">
                  Editar piezas, precio o seña
                </BotonEditar>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-tenue">Un encargo todavía no es ganancia: la seña entra a la caja, pero es plata por un trabajo que debés hasta que lo entregás.</p>
    </Pagina>
  );
}
