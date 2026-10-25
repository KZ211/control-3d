import { cargar, piezasDeVentas } from '@/lib/datos';
import { DESTINOS } from '@/lib/calculos';
import { plata, fecha, gramos, num } from '@/lib/formato';
import { Pagina, Vacio, Dato, Tabla } from '@/components/ui';
import { Accion, Formulario, Enviar } from '@/components/formulario';
import { asignarItem, borrar } from '@/app/acciones';
import { BarraCombo, ElegirParaVenta } from '@/components/combo';

export const dynamic = 'force-dynamic';

export default async function Impresiones() {
  const d = await cargar();
  const piezas = piezasDeVentas(d);
  const horas = d.impresiones.reduce((s, i) => s + Number(i.horas || 0), 0);
  const fallidas = d.impresiones.filter((i) => i.fallida).length;
  // Las de stock se pueden juntar para armar una sola venta (por ejemplo, las placas de un pedido).
  const libre = (i) => i.destino === 'stock' && !i.venta && !i.fallida;
  const enStock = d.impresiones.filter(libre).length;
  const disponibles = d.impresiones.filter(libre).map((i) => ({ id: i.id, titulo: i.pieza, gramos: Number(i.gramos) || 0, costo: Number(i.costo) || 0 }));

  return (
    <Pagina className="flex h-full flex-col">
      <div className="grid shrink-0 grid-cols-2 gap-3 md:grid-cols-4">
        <Dato nombre="Impresiones" valor={d.impresiones.length} />
        <Dato nombre="Horas" valor={num(horas)} nota="de máquina" />
        <Dato nombre="En stock" valor={enStock} nota="sin asignar a una venta" />
        <Dato
          nombre="Fallidas"
          valor={d.impresiones.length ? `${Math.round((fallidas / d.impresiones.length) * 100)}%` : '—'}
          nota={`${fallidas} salieron mal`}
          tono={fallidas ? 'pierde' : undefined}
        />
      </div>
      <BarraCombo disponibles={disponibles} />
      {d.impresiones.length === 0 ? (
        <Vacio>Todavía no cargaste impresiones.</Vacio>
      ) : (
        <Tabla className="min-h-0 flex-1">
          <thead>
            <tr>
              <th className="w-11 !p-0">
                <span className="sr-only">Elegir</span>
              </th>
              <th>Fecha</th>
              <th>Pieza</th>
              <th className="hidden md:table-cell">Máquina</th>
              <th className="num hidden sm:table-cell">Filamento</th>
              <th className="num hidden md:table-cell">Horas</th>
              <th className="num">Costo</th>
              <th>Para</th>
              <th>
                <span className="sr-only">Borrar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {d.impresiones.map((i) => (
              <tr key={i.id}>
                <td className="w-11 !p-0">{libre(i) && <ElegirParaVenta id={i.id} nombre={i.pieza} />}</td>
                <td className="whitespace-nowrap text-tenue">{fecha(i.fecha)}</td>
                <td>
                  {i.pieza}
                  {i.fallida && <span className="badge badge-error badge-sm ml-2">Fallida</span>}
                  <span className="block text-xs text-tenue">
                    {i.unidades} {i.unidades === 1 ? 'unidad' : 'unidades'} · {plata(i.porUnidad)} c/u
                    {i.notas ? ` · ${i.notas}` : ''}
                  </span>
                </td>
                <td className="hidden md:table-cell">{i.maquina?.nombre ?? '—'}</td>
                <td className="num hidden whitespace-nowrap sm:table-cell">{gramos(i.gramos)}</td>
                <td className="num hidden md:table-cell">{num(i.horas)}</td>
                <td className="num">{plata(i.costo)}</td>
                <td>
                  {i.venta ? (
                    <span>
                      {i.venta.cliente?.nombre ?? 'Venta'}
                      <span className="block text-xs text-tenue">{i.item?.descripcion}</span>
                    </span>
                  ) : i.destino === 'stock' ? (
                    <Formulario accion={asignarItem.bind(null, i.id)} limpiar={false} className="flex gap-1">
                      <select name="venta_item_id" required aria-label="Asignar a una venta" className="entrada min-h-9 w-40 text-sm" defaultValue="">
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
                        <span className="block text-xs text-tenue">{[i.para, i.valor && `vale ${plata(i.valor)}`].filter(Boolean).join(' · ')}</span>
                      )}
                    </span>
                  )}
                </td>
                <td>
                  <Accion accion={borrar.bind(null, 'impresiones', i.id)} confirmar={`¿Borrar la impresión "${i.pieza}"?`}>
                    ✕
                  </Accion>
                </td>
              </tr>
            ))}
          </tbody>
        </Tabla>
      )}
      {d.propias.cantidad > 0 && (
        <p className="shrink-0 text-xs text-tenue">
          Lo que imprimiste para vos y la familia te costó {plata(d.propias.costo)} y comprarlo hecho valdría {plata(d.propias.valor)}: te ahorraste{' '}
          {plata(d.propias.valor - d.propias.costo)}.
        </p>
      )}
    </Pagina>
  );
}
