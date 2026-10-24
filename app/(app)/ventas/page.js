import Enlace from '@/components/enlace';
import { cargar } from '@/lib/datos';
import { plata, fecha, pct, gramos, hoy } from '@/lib/formato';
import { Pagina, Seccion, Hoja, Vacio, Explica, Campo, tonoDe } from '@/components/ui';
import { Accion, Formulario, Enviar } from '@/components/formulario';
import { borrar, cobrar, editarItem, editarVenta, entregar } from '../../acciones';
import FormVenta from './form';

export const dynamic = 'force-dynamic';

function Renglones({ venta }) {
  return (
    <ul className="mt-2 space-y-1 text-sm">
      {venta.items.map((r) => (
        <li key={r.id} className="flex justify-between gap-3">
          <span>
            {Number(r.cantidad) !== 1 && `${Number(r.cantidad)} × `}
            {r.descripcion}
          </span>
          <span className="shrink-0">{plata(r.precio)}</span>
        </li>
      ))}
    </ul>
  );
}

// Cantidad, gramos y precio de cada pieza, para corregirlos o ponerle precio a un encargo.
function EditarPiezas({ venta }) {
  return (
    <ul className="mt-2 space-y-2">
      {venta.items.map((r) => (
        <li key={r.id} className="flex flex-wrap items-end gap-1">
          <span className="basis-full text-xs font-medium">{r.descripcion}</span>
          <Formulario accion={editarItem.bind(null, r.id)} limpiar={false} className="flex flex-wrap items-end gap-1">
            <input name="cantidad" aria-label={`Cantidad de ${r.descripcion}`} inputMode="decimal" defaultValue={Number(r.cantidad)} className="entrada min-h-9 w-14 text-sm" />
            <input name="gramos_unidad" aria-label={`Gramos por unidad de ${r.descripcion}`} inputMode="decimal" defaultValue={Number(r.gramos_unidad) || ''} placeholder="g c/u" className="entrada min-h-9 w-16 text-sm" />
            <input name="precio" aria-label={`Precio total de ${r.descripcion}`} inputMode="decimal" defaultValue={Number(r.precio) || ''} placeholder="Precio" className="entrada min-h-9 w-24 text-sm" />
            <Enviar className="boton-suave">OK</Enviar>
          </Formulario>
          {venta.items.length > 1 && (
            <Accion accion={borrar.bind(null, 'venta_items', r.id)} confirmar={`¿Quitar "${r.descripcion}" de la venta?`}>
              ✕
            </Accion>
          )}
        </li>
      ))}
    </ul>
  );
}

function FormCobro({ venta, accion, boton }) {
  return (
    <Formulario accion={accion} className="mt-3 flex flex-wrap items-end gap-2">
      <label className="text-sm">
        <span className="mb-1 block">Cobro</span>
        <input name="monto" inputMode="decimal" defaultValue={Math.max(0, Math.round(venta.saldo)) || ''} className="entrada w-32" />
      </label>
      <label className="text-sm">
        <span className="mb-1 block">Fecha</span>
        <input name="fecha" type="date" defaultValue={hoy()} required className="entrada" />
      </label>
      <input type="hidden" name="medio" value={venta.medio_pago ?? ''} />
      <Enviar>{boton}</Enviar>
    </Formulario>
  );
}

export default async function Ventas({ searchParams }) {
  const d = await cargar();
  const cliente = d.clientes.find((c) => c.id === searchParams?.cliente);
  const historial = d.entregadas.filter((v) => !cliente || v.cliente_id === cliente.id);
  const pendientes = d.entregadas.filter((v) => v.saldo > 0);
  const clientes = d.clientes.map(({ id, nombre }) => ({ id, nombre }));
  const productos = d.productos.map(({ id, nombre, gramos_unidad, precio_unidad }) => ({
    id,
    nombre,
    gramos_unidad: Number(gramos_unidad),
    precio_unidad: precio_unidad == null ? null : Number(precio_unidad),
  }));

  return (
    <Pagina titulo="Ventas" bajada="Cada pedido con sus piezas, lo que ya cobraste y lo que te deja.">
      <Seccion titulo="Nueva venta">
        <Hoja>
          <FormVenta hoy={hoy()} clientes={clientes} productos={productos} costoGramo={d.ajustes.costoGramo} multiplicador={d.ajustes.multiplicador} multiplicadorMayor={d.ajustes.multiplicadorMayor} />
          <Explica titulo="Bruto, neto y ganancia">
            <p>
              <strong>Venta bruta:</strong> lo que paga el cliente. <strong>Venta neta:</strong> la bruta menos lo que se va en esa venta (envío
              que pagás vos, descuentos, comisiones).
            </p>
            <p>
              <strong>Ganancia:</strong> la neta menos lo que costó producirla. Si cargás las impresiones de cada pieza, el costo es real
              (filamento, luz y desgaste); si no, se estima con los gramos y el precio por gramo, como en la planilla.
            </p>
            <p>
              Un <strong>encargo</strong> todavía no es ganancia: la seña entra a la caja, pero es plata por un trabajo que debés hasta que lo
              entregás.
            </p>
          </Explica>
        </Hoja>
      </Seccion>

      {d.encargos.length > 0 && (
        <Seccion titulo={`Encargos (${d.encargos.length})`}>
          <div className="grid gap-3 md:grid-cols-2">
            {d.encargos.map((v) => (
              <Hoja key={v.id}>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{v.cliente?.nombre ?? 'Sin cliente'}</p>
                  <Accion accion={borrar.bind(null, 'ventas', v.id)} confirmar="¿Borrar este encargo y sus señas?">
                    Borrar
                  </Accion>
                </div>
                <p className="text-sm text-tenue">
                  Pedido el {fecha(v.fecha)} · seña {plata(v.cobrado)} de {plata(v.total)}
                </p>
                <Renglones venta={v} />
                <p className="mt-3 text-sm font-medium">Marcar como entregado</p>
                <Formulario accion={entregar.bind(null, v.id)} className="mt-1 flex flex-wrap items-end gap-2">
                  <label className="text-sm">
                    <span className="mb-1 block">Fecha de entrega</span>
                    <input name="fecha" type="date" defaultValue={hoy()} required className="entrada" />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block">Cobré</span>
                    <input name="monto" inputMode="decimal" defaultValue={Math.max(0, Math.round(v.saldo)) || ''} className="entrada w-32" />
                  </label>
                  <input type="hidden" name="medio" value={v.medio_pago ?? ''} />
                  <Enviar>Entregado</Enviar>
                </Formulario>
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer font-medium text-acento">{v.total === 0 ? 'Ponerle precio' : 'Editar piezas'}</summary>
                  <EditarPiezas venta={v} />
                </details>
              </Hoja>
            ))}
          </div>
        </Seccion>
      )}

      {pendientes.length > 0 && (
        <Seccion titulo={`Te deben (${plata(pendientes.reduce((s, v) => s + v.saldo, 0))})`}>
          <div className="grid gap-3 md:grid-cols-2">
            {pendientes.map((v) => (
              <Hoja key={v.id}>
                <p className="font-semibold">{v.cliente?.nombre ?? 'Sin cliente'}</p>
                <p className="text-sm text-tenue">
                  {fecha(v.fecha)} · cobrado {plata(v.cobrado)} de {plata(v.total)}
                </p>
                <Renglones venta={v} />
                <FormCobro venta={v} accion={cobrar.bind(null, v.id)} boton="Registrar cobro" />
              </Hoja>
            ))}
          </div>
        </Seccion>
      )}

      <Seccion
        titulo={cliente ? `Ventas a ${cliente.nombre}` : 'Historial'}
        accion={
          cliente && (
            <Enlace href="/ventas" className="boton-suave">
              Ver todas
            </Enlace>
          )
        }
      >
        {historial.length === 0 ? (
          <Vacio>Todavía no hay ventas entregadas.</Vacio>
        ) : (
          <div className="overflow-x-auto border border-linea bg-hoja">
            <table className="tabla min-w-[62rem]">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cliente y piezas</th>
                  <th className="num">Bruto</th>
                  <th className="num">Costo</th>
                  <th className="num">Ganancia</th>
                  <th className="num">Margen</th>
                  <th className="num">Falta cobrar</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {historial.map((v) => (
                  <tr key={v.id}>
                    <td className="whitespace-nowrap">{fecha(v.fecha)}</td>
                    <td>
                      {v.cliente ? (
                        <Enlace href={`/ventas?cliente=${v.cliente.id}`} className="font-medium hover:underline">
                          {v.cliente.nombre}
                        </Enlace>
                      ) : (
                        <span className="text-tenue">Sin cliente</span>
                      )}
                      <span className="block text-xs text-tenue">
                        {v.detalle}
                        {v.gramos > 0 && ` · ${gramos(v.gramos)}`}
                      </span>
                      {v.items.some((r) => r.notas) && (
                        <span className="block text-xs text-acento">{v.items.map((r) => r.notas).filter(Boolean).join(' · ')}</span>
                      )}
                    </td>
                    <td className="num">{plata(v.total)}</td>
                    <td className="num">
                      {v.sinCosto && !v.costo ? <span className="text-tenue">sin datos</span> : `${v.estimado ? '≈ ' : ''}${plata(v.costo)}`}
                    </td>
                    <td className={`num font-semibold ${tonoDe(v.ganancia) === 'pierde' ? 'text-pierde' : ''}`}>{plata(v.ganancia)}</td>
                    <td className="num">{pct(v.margen)}</td>
                    <td className="num">{v.saldo > 0 ? plata(v.saldo) : '—'}</td>
                    <td>
                      <details className="text-sm">
                        <summary className="boton-suave cursor-pointer list-none">Editar</summary>
                        <div className="mt-2 w-72 space-y-3 border border-linea bg-papel p-3">
                          <Formulario accion={editarVenta.bind(null, v.id)} limpiar={false} className="space-y-2">
                            <Campo nombre="Fecha">
                              <input name="fecha" type="date" defaultValue={v.fecha} required className="entrada" />
                            </Campo>
                            <Campo nombre="Cliente">
                              <input name="cliente" list="clientes-historial" defaultValue={v.cliente?.nombre ?? ''} className="entrada" />
                            </Campo>
                            <Campo nombre="Envío o comisiones que pagaste">
                              <input name="gastos" inputMode="decimal" defaultValue={Number(v.gastos) || ''} className="entrada" />
                            </Campo>
                            <Campo nombre="Notas">
                              <input name="notas" defaultValue={v.notas ?? ''} className="entrada" />
                            </Campo>
                            <Enviar className="boton-suave min-h-11">Guardar</Enviar>
                          </Formulario>
                          <div>
                            <p className="font-medium">Piezas: cantidad, gramos c/u y precio total</p>
                            <EditarPiezas venta={v} />
                          </div>
                          {v.cobros.length > 0 && (
                            <div>
                              <p className="font-medium">Cobros</p>
                              <ul className="mt-1 space-y-1">
                                {v.cobros.map((c) => (
                                  <li key={c.id} className="flex items-center justify-between gap-2">
                                    <span>
                                      {fecha(c.fecha)} · {plata(c.monto)}
                                    </span>
                                    <Accion accion={borrar.bind(null, 'cobros', c.id)} confirmar="¿Borrar este cobro?">
                                      ✕
                                    </Accion>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <Accion
                            accion={borrar.bind(null, 'ventas', v.id)}
                            confirmar={`¿Borrar la venta "${v.titulo}"? Se borran sus piezas y cobros; las impresiones quedan sin venta.`}
                          >
                            Borrar venta
                          </Accion>
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <datalist id="clientes-historial">
              {clientes.map((c) => (
                <option key={c.id} value={c.nombre} />
              ))}
            </datalist>
          </div>
        )}
        <p className="mt-2 text-sm text-tenue">“≈” es un costo estimado con los gramos de la planilla; “sin datos”, una pieza sin gramos cargados.</p>
      </Seccion>
    </Pagina>
  );
}
