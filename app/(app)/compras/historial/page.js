import Enlace from '@/components/enlace';
import Filtro from '@/components/filtro';
import Icono from '@/components/iconos';
import { cargar } from '@/lib/datos';
import { plata, fecha } from '@/lib/formato';
import { Pagina, Vacio, Campo, ConDetalle, PanelDetalle, Tabla } from '@/components/ui';
import { Reparto } from '@/components/graficos';
import { Accion, Formulario, Enviar } from '@/components/formulario';
import { asignarMaquina, borrar, editarCompra } from '@/app/acciones';

export const dynamic = 'force-dynamic';

const CATEGORIA = { maquina: 'Máquina', accesorio: 'Accesorio', filamento: 'Filamento', insumo: 'Insumo', repuesto: 'Repuesto', otro: 'Otro' };
const FORMA = { bolsillo: 'Tu bolsillo', caja: 'Caja', cuotas: 'Cuotas', inicial: 'Ya lo tenía' };

function Detalle({ c, maquinas, cerrar }) {
  return (
    <PanelDetalle titulo={c.descripcion} subtitulo={`${fecha(c.fecha)} · ${CATEGORIA[c.categoria]}${c.proveedor ? ` · ${c.proveedor}` : ''}`} cerrar={cerrar}>
      <p className="text-3xl font-bold">{plata(c.total)}</p>
      <Formulario accion={editarCompra.bind(null, c.id)} limpiar={false} className="grid grid-cols-2 gap-2">
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
            <option value="caja">La caja</option>
            <option value="cuotas">Cuotas</option>
            <option value="inicial">Ya lo tenía (no fue un gasto)</option>
          </select>
        </Campo>
        <Campo nombre="Cuotas" ayuda="Solo si es en cuotas.">
          <input name="cuotas" inputMode="numeric" defaultValue={c.cuotas ?? ''} className="entrada" />
        </Campo>
        <Enviar className="boton-suave col-span-2 min-h-11">Guardar cambios</Enviar>
      </Formulario>
      {['maquina', 'accesorio', 'repuesto'].includes(c.categoria) && maquinas.length > 0 && (
        <Formulario accion={asignarMaquina.bind(null, c.id)} limpiar={false} className="flex items-end gap-2">
          <Campo nombre="De qué impresora" className="flex-1">
            <select name="maquina_id" required className="entrada" defaultValue={c.maquina_id ?? ''}>
              <option value="" disabled>
                Elegí la impresora
              </option>
              {maquinas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </Campo>
          <Enviar className="boton-suave min-h-11">Asociar</Enviar>
        </Formulario>
      )}
      {c.notas && <p className="text-sm text-tenue">{c.notas}</p>}
      <Accion accion={borrar.bind(null, 'compras', c.id)} confirmar={`¿Borrar la compra "${c.descripcion}"?`} className="btn btn-outline btn-error btn-sm w-full">
        Borrar compra
      </Accion>
    </PanelDetalle>
  );
}

export default async function HistorialCompras({ searchParams }) {
  const d = await cargar();
  const tipo = CATEGORIA[searchParams?.tipo] ? searchParams.tipo : '';
  const compras = d.compras.filter((c) => !tipo || c.categoria === tipo);
  const elegida = d.compras.find((c) => c.id === searchParams?.v);
  const maquinas = d.maquinas.map(({ id, nombre }) => ({ id, nombre }));
  const enlace = (extra = {}) => {
    const q = new URLSearchParams({ ...(tipo && { tipo }), ...extra }).toString();
    return `/compras/historial${q ? `?${q}` : ''}`;
  };
  const sinMaquina = d.compras.filter((c) => (c.categoria === 'maquina' || c.categoria === 'accesorio') && !c.maquina_id);
  const porTipo = Object.keys(CATEGORIA)
    .map((k) => ({ nombre: CATEGORIA[k], valor: d.compras.filter((c) => c.categoria === k).reduce((s, c) => s + Number(c.total), 0) }))
    .sort((a, b) => b.valor - a.valor);
  const total = compras.reduce((s, c) => s + Number(c.total), 0);

  const lista =
    compras.length === 0 ? (
      <Vacio>No hay compras con ese filtro.</Vacio>
    ) : (
      <Tabla className="h-full">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Compra</th>
            <th className="hidden sm:table-cell">Pagada con</th>
            <th className="num">Total</th>
            <th>
              <span className="sr-only">Abrir</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {compras.map((c) => (
            <tr key={c.id} className={elegida?.id === c.id ? 'bg-acento/10' : 'hover:bg-papel'}>
              <td className="whitespace-nowrap text-tenue">{fecha(c.fecha)}</td>
              <td>
                <Enlace href={enlace({ v: c.id })} className="font-medium hover:underline">
                  {c.descripcion}
                </Enlace>
                <span className="block text-xs text-tenue">{CATEGORIA[c.categoria]}</span>
              </td>
              <td className="hidden sm:table-cell">
                {FORMA[c.forma_pago]}
                {c.forma_pago === 'cuotas' && ` (${c.cuotas})`}
              </td>
              <td className="num font-medium">{plata(c.total)}</td>
              <td className="w-8 !p-0">
                <Enlace href={enlace({ v: c.id })} aria-label={`Ver ${c.descripcion}`} className="flex min-h-11 items-center justify-center text-tenue hover:text-tinta">
                  <Icono nombre="siguiente" className="h-4 w-4" />
                </Enlace>
              </td>
            </tr>
          ))}
        </tbody>
      </Tabla>
    );

  const resumen = (
    <div className="tarjeta h-full overflow-y-auto p-4">
      <h2 className="rotulo mb-3">En qué gastaste · {plata(d.compras.reduce((s, c) => s + Number(c.total), 0))}</h2>
      <Reparto partes={porTipo} etiqueta="Compras por tipo" />
      {sinMaquina.length > 0 && maquinas.length > 0 && (
        <div className="mt-5 rounded-box border border-acento/40 bg-acento/10 p-3 text-sm">
          <p className="font-medium">Equipos sin impresora</p>
          <p className="text-xs text-tenue">Asocialos para que su precio se sume al de la máquina.</p>
          <ul className="mt-2 space-y-1">
            {sinMaquina.map((c) => (
              <li key={c.id}>
                <Enlace href={enlace({ v: c.id })} className="underline">
                  {c.descripcion} · {plata(c.total)}
                </Enlace>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <Pagina className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Filtro parametro="tipo" etiqueta="Tipo" todos="Todo" opciones={Object.entries(CATEGORIA)} />
        <p className="ml-auto text-sm text-tenue">
          {compras.length} compras · <strong className="text-tinta">{plata(total)}</strong>
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <ConDetalle lista={lista} detalle={elegida ? <Detalle c={elegida} maquinas={maquinas} cerrar={enlace()} /> : resumen} abierto={Boolean(elegida)} />
      </div>
    </Pagina>
  );
}
