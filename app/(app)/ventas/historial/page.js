import Enlace from '@/components/enlace';
import Filtro from '@/components/filtro';
import Icono from '@/components/iconos';
import { cargar } from '@/lib/datos';
import { plata, fecha, pct, gramos, nombreMes } from '@/lib/formato';
import { Pagina, Vacio, ConDetalle, PanelDetalle, Tabla, tonoDe } from '@/components/ui';
import { Accion } from '@/components/formulario';
import { BotonEditar } from '@/components/dialogo-venta';
import { borrar, cobrar } from '@/app/acciones';
import { FormCobro, Cobrado, Renglones, paraEditar } from '../partes';

export const dynamic = 'force-dynamic';

function Detalle({ v, cerrar }) {
  return (
    <PanelDetalle titulo={v.cliente?.nombre ?? 'Sin cliente'} subtitulo={`${fecha(v.fecha)}${v.medio_pago ? ` · ${v.medio_pago}` : ''}`} cerrar={cerrar}>
      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          ['Total', plata(v.total)],
          ['Ganancia', `${v.estimado ? '≈ ' : ''}${plata(v.ganancia)}`],
          ['Margen', pct(v.margen)],
        ].map(([n, valor]) => (
          <div key={n} className="rounded-box bg-papel p-2">
            <dt className="text-[11px] text-tenue">{n}</dt>
            <dd className="font-bold">{valor}</dd>
          </div>
        ))}
      </dl>
      <Renglones venta={v} />
      <Cobrado venta={v} />
      {v.saldo > 0 && <FormCobro venta={v} accion={cobrar.bind(null, v.id)} boton="Cobré" />}

      <BotonEditar edicion={paraEditar(v)} className="boton-suave min-h-11 w-full">
        Editar piezas, cliente o fecha
      </BotonEditar>
      {v.notas && <p className="text-sm text-tenue">{v.notas}</p>}

      {v.cobros.length > 0 && (
        <div>
          <p className="rotulo mb-2">Cobros</p>
          <ul className="space-y-1 text-sm">
            {v.cobros.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2">
                <span>
                  {fecha(c.fecha)} · {plata(c.monto)}
                  {c.medio && <span className="text-tenue"> · {c.medio}</span>}
                </span>
                <Accion
                  accion={borrar.bind(null, 'cobros', c.id)}
                  confirmar={`¿Borrar el cobro de ${plata(c.monto)} del ${fecha(c.fecha)}?`}
                  className="btn btn-ghost btn-square h-11 min-h-11 w-11 text-tenue hover:text-pierde"
                  etiqueta={`Borrar el cobro de ${plata(c.monto)}`}
                >
                  <Icono nombre="borrar" className="h-4 w-4" />
                </Accion>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-2 border-t border-linea pt-4">
        <Accion
          accion={borrar.bind(null, 'ventas', v.id)}
          confirmar={`¿Borrar la venta "${v.titulo}"? Se borran sus piezas y cobros; las impresiones quedan sin venta.`}
          className="btn btn-ghost min-h-11 w-full border border-pierde/40 font-medium text-pierde hover:bg-pierde/10"
        >
          <Icono nombre="borrar" className="h-4 w-4" /> Borrar venta
        </Accion>
      </div>
    </PanelDetalle>
  );
}

export default async function Historial({ searchParams }) {
  const d = await cargar();
  const filtroCliente = searchParams?.cliente ?? '';
  const filtroMes = /^\d{4}-\d{2}$/.test(searchParams?.mes ?? '') ? searchParams.mes : '';
  const ventas = d.entregadas.filter((v) => (!filtroCliente || v.cliente_id === filtroCliente) && (!filtroMes || v.fecha.startsWith(filtroMes)));
  const elegida = d.entregadas.find((v) => v.id === searchParams?.v);

  const base = { ...(filtroCliente && { cliente: filtroCliente }), ...(filtroMes && { mes: filtroMes }) };
  const enlace = (extra = {}) => {
    const q = new URLSearchParams({ ...base, ...extra }).toString();
    return `/ventas/historial${q ? `?${q}` : ''}`;
  };

  const meses = [...new Set(d.entregadas.map((v) => v.fecha.slice(0, 7)))].sort().reverse();
  const clientes = d.clientes.filter((c) => c.pedidos > 0);
  const total = ventas.reduce((s, v) => s + v.total, 0);
  const ganancia = ventas.reduce((s, v) => s + v.ganancia, 0);

  // Con el detalle abierto la tabla tiene menos lugar: el margen se ve en el detalle.
  const margen = elegida ? 'hidden 2xl:table-cell' : 'hidden md:table-cell';
  const lista =
    ventas.length === 0 ? (
      <Vacio>No hay ventas con ese filtro.</Vacio>
    ) : (
      <Tabla className="h-full">
        <thead>
          <tr>
            <th className="hidden sm:table-cell">Fecha</th>
            <th>Cliente y piezas</th>
            <th className="num">Total</th>
            <th className="num hidden sm:table-cell">Ganancia</th>
            <th className={`num ${margen}`}>Margen</th>
            <th className="num hidden md:table-cell">Debe</th>
            <th>
              <span className="sr-only">Abrir</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {ventas.map((v) => (
            <tr key={v.id} className={elegida?.id === v.id ? 'bg-acento/10' : 'hover:bg-papel'}>
              <td className="hidden whitespace-nowrap text-tenue sm:table-cell">{fecha(v.fecha)}</td>
              <td>
                <Enlace href={enlace({ v: v.id })} className="group block py-0.5">
                  <span className="font-medium group-hover:underline">{v.cliente?.nombre ?? 'Sin cliente'}</span>
                  <span className="block max-w-[10.5rem] truncate text-xs text-tenue sm:max-w-xs">
                    <span className="sm:hidden">{fecha(v.fecha)} · </span>
                    {v.detalle}
                    {v.gramos > 0 && ` · ${gramos(v.gramos)}`}
                  </span>
                </Enlace>
              </td>
              <td className="num font-medium">{v.total ? plata(v.total) : <span className="text-xs font-normal text-tenue">sin precio</span>}</td>
              <td className={`num hidden sm:table-cell ${tonoDe(v.ganancia) === 'pierde' ? 'text-pierde' : ''}`}>
                {v.sinCosto && !v.costo ? <span className="text-tenue">—</span> : `${v.estimado ? '≈ ' : ''}${plata(v.ganancia)}`}
              </td>
              <td className={`num ${margen}`}>{pct(v.margen)}</td>
              <td className="num hidden md:table-cell">{v.saldo > 0 ? <span className="font-semibold text-pierde">{plata(v.saldo)}</span> : '—'}</td>
              <td className="w-11 !p-0">
                <Enlace href={enlace({ v: v.id })} aria-label={`Ver la venta de ${v.cliente?.nombre ?? 'sin cliente'}`} className="flex min-h-11 min-w-11 items-center justify-center text-tenue hover:text-tinta">
                  <Icono nombre="siguiente" className="h-4 w-4" />
                </Enlace>
              </td>
            </tr>
          ))}
        </tbody>
      </Tabla>
    );

  return (
    <Pagina className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Filtro parametro="cliente" etiqueta="Cliente" todos="Todos los clientes" opciones={clientes.map((c) => [c.id, c.nombre])} />
        <Filtro parametro="mes" etiqueta="Mes" todos="Todos los meses" opciones={meses.map((m) => [m, nombreMes(m)])} />
        <p className="ml-auto text-sm text-tenue">
          {ventas.length} ventas · <strong className="text-tinta">{plata(total)}</strong> · ganancia {plata(ganancia)} ({pct(total ? ganancia / total : 0)})
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <ConDetalle lista={lista} detalle={elegida && <Detalle v={elegida} cerrar={enlace()} />} />
      </div>
      <p className="shrink-0 text-xs text-tenue">“≈” es una ganancia con el costo estimado por los gramos de la planilla.</p>
    </Pagina>
  );
}
