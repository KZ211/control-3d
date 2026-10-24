import { cargar } from '@/lib/datos';
import { plata, fecha, hace } from '@/lib/formato';
import Icono from '@/components/iconos';
import { Pagina, Vacio } from '@/components/ui';
import { Accion } from '@/components/formulario';
import { Pendiente, CobroRapido } from '@/components/pendientes';
import { BotonEditar } from '@/components/dialogo-venta';
import { borrar } from '@/app/acciones';
import { Renglones, Cobrado, paraEditar, paraCobrar } from '../partes';

export const dynamic = 'force-dynamic';

// Los encargos como lista de trabajo: una fila por pedido y una acción. Entregar
// abre el cobro ahí mismo; un encargo sin precio pide primero el precio.
export default async function Encargos() {
  const d = await cargar();
  const total = d.encargos.reduce((s, v) => s + v.total, 0);
  const senas = d.encargos.reduce((s, v) => s + v.cobrado, 0);

  return (
    <Pagina className="!max-w-4xl">
      <p className="text-sm text-tenue">
        <strong className="text-base text-tinta">
          {d.encargos.length} {d.encargos.length === 1 ? 'encargo' : 'encargos'} por entregar
        </strong>
        {total > 0 && <> · valen {plata(total)}</>}
        {senas > 0 && <> · ya cobraste {plata(senas)} en señas</>}
      </p>
      {d.encargos.length === 0 ? (
        <Vacio>No tenés encargos pendientes. Al cargar una venta, elegí “Encargo” si todavía falta hacerla o entregarla.</Vacio>
      ) : (
        <ul className="tarjeta divide-y divide-linea">
          {d.encargos.map((v) => {
            const sinPrecio = v.total === 0;
            return (
              <Pendiente
                key={v.id}
                titulo={v.cliente?.nombre ?? 'Sin cliente'}
                detalle={v.detalle}
                nota={`Pedido el ${fecha(v.fecha)} · ${hace(v.fecha)}${v.cobrado ? ` · seña ${plata(v.cobrado)}` : ''}`}
                monto={sinPrecio ? 'Sin precio' : plata(v.saldo > 0 ? v.saldo : v.total)}
                montoTono={sinPrecio ? 'text-sm font-medium text-tenue' : ''}
                boton="Entregar"
                principal={!sinPrecio}
                extra={
                  sinPrecio && (
                    <BotonEditar edicion={paraEditar(v)} className="btn btn-primary min-h-11">
                      Ponerle precio
                    </BotonEditar>
                  )
                }
              >
                <Renglones venta={v} />
                <Cobrado venta={v} />
                <CobroRapido venta={paraCobrar(v)} tipo="entregar" />
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-linea pt-3">
                  <BotonEditar edicion={paraEditar(v)} className="btn btn-ghost min-h-11 border border-linea">
                    Editar el encargo
                  </BotonEditar>
                  <Accion
                    accion={borrar.bind(null, 'ventas', v.id)}
                    confirmar={`¿Borrar el encargo de ${v.cliente?.nombre ?? 'sin cliente'}? También se borran sus señas.`}
                    className="btn btn-ghost min-h-11 text-pierde hover:bg-pierde/10"
                  >
                    <Icono nombre="borrar" className="h-4 w-4" /> Borrar
                  </Accion>
                </div>
              </Pendiente>
            );
          })}
        </ul>
      )}
      <p className="text-xs text-tenue">
        El monto de cada fila es lo que falta cobrar. Un encargo todavía no es ganancia: la seña entra a la caja, pero es plata por un trabajo que debés hasta que lo
        entregás.
      </p>
    </Pagina>
  );
}
