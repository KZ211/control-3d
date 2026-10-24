import { cargar } from '@/lib/datos';
import { plata, plataFina, fecha, gramos, hoy } from '@/lib/formato';
import { Pagina, Seccion, Hoja, Vacio, Explica, Avance, Campo } from '@/components/ui';
import { Accion, Formulario, Enviar } from '@/components/formulario';
import { asignarMaquina, borrar, editarCompra, marcarAgotado, pagarCuota } from '../../acciones';
import FormCompra from './form';

export const dynamic = 'force-dynamic';

const CATEGORIA = { maquina: 'Máquina', accesorio: 'Accesorio', filamento: 'Filamento', insumo: 'Insumo', repuesto: 'Repuesto', otro: 'Otro' };
const FORMA = { bolsillo: 'Tu bolsillo', caja: 'Caja', cuotas: 'Cuotas' };

export default async function Compras() {
  const d = await cargar();
  const maquinas = d.maquinas.map(({ id, nombre }) => ({ id, nombre }));
  const enCuotas = d.compras.filter((c) => c.forma_pago === 'cuotas');
  const filamento = d.compras.filter((c) => c.categoria === 'filamento');
  const sinMaquina = d.compras.filter((c) => (c.categoria === 'maquina' || c.categoria === 'accesorio') && !c.maquina_id);

  return (
    <Pagina titulo="Compras" bajada="Todo lo que comprás para imprimir: máquinas, filamento, repuestos e insumos.">
      <Seccion titulo="Nueva compra">
        <Hoja>
          <FormCompra hoy={hoy()} maquinas={maquinas} />
          <Explica titulo="¿Caja, bolsillo o cuotas?">
            <p>
              <strong>De la caja:</strong> la pagaste con plata que generaron las ventas. Baja la caja.
            </p>
            <p>
              <strong>De tu bolsillo:</strong> la pagaste con tu plata (por ejemplo, la liquidación). Suma a lo que querés recuperar.
            </p>
            <p>
              <strong>En cuotas:</strong> es una deuda. Cada cuota que pagás la registrás abajo y elegís si salió de la caja o de tu bolsillo.
            </p>
          </Explica>
        </Hoja>
      </Seccion>

      {enCuotas.length > 0 && (
        <Seccion titulo="Cuotas">
          <div className="grid gap-4 md:grid-cols-2">
            {enCuotas.map((c) => (
              <Hoja key={c.id}>
                <p className="font-semibold">{c.descripcion}</p>
                <p className="mt-1 text-sm text-tenue">
                  {c.cuotasPagadas} de {c.cuotas} cuotas · pagaste {plata(c.pagado)} de {plata(c.total)}
                </p>
                <div className="mt-3">
                  <Avance valor={c.total ? c.pagado / c.total : 0} etiqueta={`Pagado ${plata(c.pagado)} de ${plata(c.total)}`} />
                </div>
                {c.debe > 0 ? (
                  <Formulario accion={pagarCuota.bind(null, c.id)} className="mt-4 flex flex-wrap items-end gap-2">
                    <label className="text-sm">
                      <span className="mb-1 block">Monto</span>
                      <input name="monto" inputMode="decimal" defaultValue={Math.round(Math.min(c.valorCuota ?? c.debe, c.debe))} required className="entrada w-32" />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block">Fecha</span>
                      <input name="fecha" type="date" defaultValue={hoy()} required className="entrada" />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block">Pagada con</span>
                      <select name="pagado_con" className="entrada" defaultValue="bolsillo">
                        <option value="bolsillo">Mi bolsillo</option>
                        <option value="caja">La caja</option>
                      </select>
                    </label>
                    <Enviar>Pagar cuota</Enviar>
                  </Formulario>
                ) : (
                  <p className="mt-3 text-sm font-semibold text-gana">Pagada completa</p>
                )}
                {c.pagos.length > 0 && (
                  <ul className="mt-4 space-y-1 text-sm">
                    {c.pagos.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2">
                        <span>
                          {fecha(p.fecha)} · {plata(p.monto)} · {p.pagado_con === 'caja' ? 'de la caja' : 'de tu bolsillo'}
                        </span>
                        <Accion accion={borrar.bind(null, 'pagos_cuotas', p.id)} confirmar="¿Borrar este pago?">
                          Borrar
                        </Accion>
                      </li>
                    ))}
                  </ul>
                )}
              </Hoja>
            ))}
          </div>
        </Seccion>
      )}

      {sinMaquina.length > 0 && maquinas.length > 0 && (
        <Seccion titulo="Equipos sin impresora">
          <Hoja>
            <p className="text-sm text-tenue">
              Asocialos a la impresora con la que los usás: su precio se suma al de esa máquina y se reparte en su desgaste.
            </p>
            <ul className="mt-3 space-y-2">
              {sinMaquina.map((c) => (
                <li key={c.id}>
                  <Formulario accion={asignarMaquina.bind(null, c.id)} limpiar={false} className="flex flex-wrap items-center gap-2">
                    <span className="min-w-40 font-medium">
                      {c.descripcion} · {plata(c.total)}
                    </span>
                    <select name="maquina_id" required aria-label={`Impresora de ${c.descripcion}`} className="entrada w-56" defaultValue="">
                      <option value="" disabled>
                        Elegí la impresora
                      </option>
                      {maquinas.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nombre}
                        </option>
                      ))}
                    </select>
                    <Enviar className="boton-suave min-h-11">Asociar</Enviar>
                  </Formulario>
                </li>
              ))}
            </ul>
          </Hoja>
        </Seccion>
      )}

      {filamento.length > 0 && (
        <Seccion titulo="Filamento">
          <div className="overflow-x-auto border border-linea bg-hoja">
            <table className="tabla min-w-[44rem]">
              <thead>
                <tr>
                  <th>Lote</th>
                  <th className="num">Costo por gramo</th>
                  <th className="num">Usado</th>
                  <th className="num">Quedan</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filamento.map((c) => (
                  <tr key={c.id} className={c.agotado ? 'text-tenue' : ''}>
                    <td>
                      {[c.material, c.color].filter(Boolean).join(' ') || c.descripcion}
                      <span className="block text-xs text-tenue">
                        {fecha(c.fecha)} · {Number(c.cantidad)} × {gramos(c.gramos_por_unidad ?? 1000)} · {plata(c.total)}
                      </span>
                    </td>
                    <td className="num">{plataFina(c.lote.costoGramo)}</td>
                    <td className="num">
                      {gramos(c.lote.usados)}
                      {c.lote.usadosSinLote > 0 && <span className="block text-xs text-tenue">{gramos(c.lote.usadosSinLote)} sin lote</span>}
                    </td>
                    <td className="num">{c.agotado ? 'Agotado' : gramos(Math.max(0, c.lote.gramos - c.lote.usados))}</td>
                    <td className="text-right">
                      <Accion accion={marcarAgotado.bind(null, c.id, !c.agotado)}>{c.agotado ? 'Tengo stock' : 'Se terminó'}</Accion>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-sm text-tenue">
            “Se terminó” saca el lote del stock aunque no hayas registrado todos los gramos (por ejemplo, rollos usados antes de la app).
          </p>
          {d.gramosSueltos.ventas + d.gramosSueltos.impresiones > 0 && (
            <p className="mt-2 border-l-4 border-acento bg-hoja p-3 text-sm">
              {gramos(d.gramosSueltos.ventas + d.gramosSueltos.impresiones)} impresos no dicen de qué rollo salieron ({gramos(d.gramosSueltos.ventas)} de
              ventas sin impresiones cargadas, como las de la planilla, y {gramos(d.gramosSueltos.impresiones)} de impresiones sin lote). Se descuentan de
              los rollos más viejos primero.
              {d.gramosSueltos.sinRollo > 0 && ` ${gramos(d.gramosSueltos.sinRollo)} no entran en ningún rollo: falta cargar alguna compra de filamento.`}{' '}
              Si al contar lo que tenés no coincide, usá “Se terminó” o corregí los gramos del lote.
            </p>
          )}
        </Seccion>
      )}

      <Seccion titulo="Todas las compras">
        {d.compras.length === 0 ? (
          <Vacio>Todavía no cargaste compras.</Vacio>
        ) : (
          <div className="overflow-x-auto border border-linea bg-hoja">
            <table className="tabla min-w-[48rem]">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Compra</th>
                  <th>Tipo</th>
                  <th>Pagada con</th>
                  <th className="num">Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {d.compras.map((c) => (
                  <tr key={c.id}>
                    <td className="whitespace-nowrap">{fecha(c.fecha)}</td>
                    <td>
                      {c.descripcion}
                      {(() => {
                        const maquina = d.maquinas.find((m) => m.id === c.maquina_id)?.nombre;
                        const extra = [maquina !== c.descripcion && maquina, c.proveedor, c.notas].filter(Boolean).join(' · ');
                        return extra && <span className="block text-xs text-tenue">{extra}</span>;
                      })()}
                    </td>
                    <td>{CATEGORIA[c.categoria]}</td>
                    <td>
                      {FORMA[c.forma_pago]}
                      {c.forma_pago === 'cuotas' && ` (${c.cuotas})`}
                    </td>
                    <td className="num">{plata(c.total)}</td>
                    <td className="text-right">
                      <details className="text-left text-sm">
                        <summary className="boton-suave cursor-pointer list-none">Editar</summary>
                        <div className="mt-2 w-64 space-y-3 border border-linea bg-papel p-3">
                          <Formulario accion={editarCompra.bind(null, c.id)} limpiar={false} className="space-y-2">
                            <Campo nombre="Fecha">
                              <input name="fecha" type="date" defaultValue={c.fecha} required className="entrada" />
                            </Campo>
                            <Campo nombre="Total">
                              <input name="total" inputMode="decimal" defaultValue={Number(c.total)} required className="entrada" />
                            </Campo>
                            {c.categoria === 'filamento' && (
                              <Campo nombre="Gramos por rollo">
                                <input name="gramos_por_unidad" inputMode="numeric" defaultValue={c.gramos_por_unidad ?? 1000} className="entrada" />
                              </Campo>
                            )}
                            <Campo nombre="Pagada con">
                              <select name="forma_pago" defaultValue={c.forma_pago} className="entrada">
                                <option value="bolsillo">Mi bolsillo</option>
                                <option value="caja">La caja (plata de las ventas)</option>
                                <option value="cuotas">Cuotas</option>
                              </select>
                            </Campo>
                            <Campo nombre="Cuotas" ayuda="Solo si es en cuotas.">
                              <input name="cuotas" inputMode="numeric" defaultValue={c.cuotas ?? ''} className="entrada" />
                            </Campo>
                            <Enviar className="boton-suave min-h-11">Guardar</Enviar>
                          </Formulario>
                          <Accion accion={borrar.bind(null, 'compras', c.id)} confirmar={`¿Borrar la compra "${c.descripcion}"?`}>
                            Borrar compra
                          </Accion>
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Seccion>
    </Pagina>
  );
}
