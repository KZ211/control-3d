import { cargar } from '@/lib/datos';
import { DESTINOS } from '@/lib/calculos';
import { plata, fecha, gramos, num, hoy } from '@/lib/formato';
import { Pagina, Seccion, Hoja, Vacio, Explica } from '@/components/ui';
import { Accion, Formulario, Enviar } from '@/components/formulario';
import { asignarItem, borrar } from '../../acciones';
import FormImpresion from './form';

export const dynamic = 'force-dynamic';

export default async function Impresiones() {
  const d = await cargar();
  const maquinas = d.maquinas.map(({ id, nombre, consumo_watts, porHora }) => ({ id, nombre, consumo_watts, porHora }));
  // Nombre del lote: material y color, o la descripción con la fecha de compra.
  const lotes = d.stock.map(({ id, descripcion, material, color, fecha: dia, costoGramo, quedan }) => ({
    id,
    nombre: [material, color].filter(Boolean).join(' ') || `${descripcion} del ${fecha(dia)}`,
    costoGramo,
    quedan,
  }));
  // Las piezas de ventas a las que se les puede asignar una impresión: primero encargos, después las más nuevas.
  const piezas = [...d.encargos, ...d.entregadas].flatMap((v) =>
    v.items.map((r) => ({
      id: r.id,
      nombre: `${v.estado === 'encargo' ? 'Encargo · ' : ''}${v.cliente?.nombre ?? 'Sin cliente'} · ${Number(r.cantidad) !== 1 ? `${Number(r.cantidad)} × ` : ''}${r.descripcion}`,
    }))
  );
  const productos = d.productos.map(({ id, nombre, gramos_unidad, horas_unidad }) => ({
    id,
    nombre,
    gramos_unidad: Number(gramos_unidad),
    horas_unidad: horas_unidad == null ? null : Number(horas_unidad),
  }));

  return (
    <Pagina titulo="Impresiones" bajada="Cada impresión, vendida o no. El costo sale del filamento, la luz y el desgaste de la máquina.">
      <Seccion titulo="Nueva impresión">
        <Hoja>
          <FormImpresion
            hoy={hoy()}
            maquinas={maquinas}
            lotes={lotes}
            piezas={piezas}
            productos={productos}
            precioKwh={d.ajustes.precioKwh}
            costoGramo={d.ajustes.costoGramo}
            multiplicador={d.ajustes.multiplicador}
            multiplicadorMayor={d.ajustes.multiplicadorMayor}
          />
          <Explica titulo="¿Cómo se calcula el costo?">
            <p>
              <strong>Filamento:</strong> gramos × lo que te costó cada gramo de ese lote (precio del lote ÷ gramos del lote). Sin lote, se usa el
              precio por gramo de Ajustes. El precio queda guardado: si después cambia el filamento, esta impresión no cambia.
            </p>
            <p>
              <strong>Luz:</strong> horas × consumo de la máquina en kW × precio del kWh de tu factura.
            </p>
            <p>
              <strong>Desgaste:</strong> horas × (precio de la máquina ÷ horas de vida útil). Es la parte de la impresora que “gasta” cada
              impresión.
            </p>
            <p>
              <strong>Para qué es:</strong> si es para una venta, su costo pasa a esa venta. Si es <strong>stock</strong>, queda como piezas
              hechas (valen lo que costaron) hasta que la asignes a una venta. Lo que imprimís para vos, los regalos y las pruebas son gasto.
            </p>
          </Explica>
        </Hoja>
      </Seccion>

      <Seccion titulo="Historial">
        {d.impresiones.length === 0 ? (
          <Vacio>Todavía no cargaste impresiones.</Vacio>
        ) : (
          <div className="overflow-x-auto border border-linea bg-hoja">
            <table className="tabla min-w-[58rem]">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Pieza</th>
                  <th>Máquina</th>
                  <th className="num">Filamento</th>
                  <th className="num">Horas</th>
                  <th className="num">Costo</th>
                  <th className="num">Por unidad</th>
                  <th>Para</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {d.impresiones.map((i) => (
                  <tr key={i.id}>
                    <td className="whitespace-nowrap">{fecha(i.fecha)}</td>
                    <td>
                      {i.pieza}
                      {i.fallida && <span className="ml-2 text-xs font-semibold uppercase text-pierde">Fallida</span>}
                      <span className="block text-xs text-tenue">
                        {i.unidades} {i.unidades === 1 ? 'unidad' : 'unidades'}
                        {i.notas ? ` · ${i.notas}` : ''}
                      </span>
                    </td>
                    <td>{i.maquina?.nombre ?? '—'}</td>
                    <td className="num whitespace-nowrap">{gramos(i.gramos)}</td>
                    <td className="num">{num(i.horas)}</td>
                    <td className="num">{plata(i.costo)}</td>
                    <td className="num">{plata(i.porUnidad)}</td>
                    <td>
                      {i.venta ? (
                        <span>
                          {i.venta.cliente?.nombre ?? 'Venta'}
                          <span className="block text-xs text-tenue">{i.item?.descripcion}</span>
                        </span>
                      ) : i.destino === 'stock' ? (
                        <Formulario accion={asignarItem.bind(null, i.id)} limpiar={false} className="flex gap-1">
                          <select name="venta_item_id" required aria-label="Asignar a una venta" className="entrada min-h-9 w-44 text-sm" defaultValue="">
                            <option value="" disabled>
                              Stock · asignar a…
                            </option>
                            {piezas.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nombre}
                              </option>
                            ))}
                          </select>
                          <Enviar className="boton-suave">OK</Enviar>
                        </Formulario>
                      ) : (
                        <span>
                          {DESTINOS[i.destino]}
                          {(i.para || i.valor) && (
                            <span className="block text-xs text-tenue">
                              {[i.para, i.valor && `vale ${plata(i.valor)}`].filter(Boolean).join(' · ')}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                    <td>
                      <Accion accion={borrar.bind(null, 'impresiones', i.id)} confirmar={`¿Borrar la impresión "${i.pieza}"?`}>
                        Borrar
                      </Accion>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {d.propias.cantidad > 0 && (
          <p className="mt-3 text-sm text-tenue">
            Lo que imprimiste para vos y la familia te costó {plata(d.propias.costo)} y comprarlo hecho valdría {plata(d.propias.valor)}: te ahorraste{' '}
            {plata(d.propias.valor - d.propias.costo)}.
          </p>
        )}
      </Seccion>
    </Pagina>
  );
}
