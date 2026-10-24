import Enlace from '@/components/enlace';
import Icono from '@/components/iconos';
import { Ranking } from '@/components/graficos';
import { cargar } from '@/lib/datos';
import { plata, fecha, pct } from '@/lib/formato';
import { Pagina, Vacio, Campo, Dato, ConDetalle, PanelDetalle, Tabla } from '@/components/ui';
import { Accion, Formulario, Enviar } from '@/components/formulario';
import { borrar, crearCliente, editarCliente, unirClientes } from '@/app/acciones';
import { posiblesRepetidos, mismoCliente } from '@/lib/nombres';

export const dynamic = 'force-dynamic';

function CamposCliente({ c = {} }) {
  return (
    <>
      <Campo nombre="Nombre">
        <input name="nombre" required defaultValue={c.nombre ?? ''} className="entrada" />
      </Campo>
      <Campo nombre="Contacto">
        <input name="contacto" defaultValue={c.contacto ?? ''} className="entrada" placeholder="Teléfono, Instagram…" />
      </Campo>
      <Campo nombre="Notas">
        <input name="notas" defaultValue={c.notas ?? ''} className="entrada" />
      </Campo>
    </>
  );
}

export default async function Clientes({ searchParams }) {
  const d = await cargar();
  const conVentas = d.clientes.filter((c) => c.pedidos || c.encargos);
  const total = conVentas.reduce((s, c) => s + c.comprado, 0);
  const deben = d.clientes.filter((c) => c.debe > 0);
  const vuelven = conVentas.filter((c) => c.pedidos > 1).length;
  const elegido = d.clientes.find((c) => c.id === searchParams?.c);
  const nuevo = searchParams?.c === 'nuevo';
  const top = d.clientes.filter((c) => c.comprado > 0).slice(0, 5);
  const top5 = top.reduce((s, c) => s + c.comprado, 0);
  const repetidos = posiblesRepetidos(d.clientes);

  const lista = (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="grid shrink-0 grid-cols-2 sm:grid-cols-3 gap-3">
        <Dato className="col-span-2 sm:col-span-1" nombre="Compraron" valor={conVentas.length} nota="clientes" />
        <Dato nombre="Vuelven" valor={conVentas.length ? `${Math.round((vuelven / conVentas.length) * 100)}%` : '—'} nota={`${vuelven} con más de un pedido`} />
        <Dato nombre="Te deben" valor={plata(deben.reduce((s, c) => s + c.debe, 0))} nota={`${deben.length} clientes`} tono={deben.length ? 'pierde' : undefined} />
      </div>
      <div className="flex shrink-0 items-center justify-between">
        <h2 className="rotulo">Todos</h2>
        <Enlace href="/ventas/clientes?c=nuevo" className="boton-suave">
          <Icono nombre="sumar" className="h-4 w-4" /> Cliente
        </Enlace>
      </div>
      {d.clientes.length === 0 ? (
        <Vacio>Los clientes se crean solos al cargar una venta.</Vacio>
      ) : (
        <Tabla className="min-h-0 flex-1">
          <thead>
            <tr>
              <th>Cliente</th>
              <th className="num">Pedidos</th>
              <th className="num">Compró</th>
              <th className="num hidden sm:table-cell">Del total</th>
              <th className="num hidden md:table-cell">Debe</th>
              <th className="hidden md:table-cell">Última</th>
              <th>
                <span className="sr-only">Abrir</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {d.clientes.map((c) => (
              <tr key={c.id} className={elegido?.id === c.id ? 'bg-acento/10' : 'hover:bg-papel'}>
                <td>
                  <Enlace href={`/ventas/clientes?c=${c.id}`} className="-my-2 inline-flex min-h-11 items-center font-medium hover:underline">
                    {c.nombre}
                  </Enlace>
                  {c.encargos > 0 && <span className="badge badge-ghost badge-sm ml-2">{c.encargos} encargo{c.encargos > 1 ? 's' : ''}</span>}
                </td>
                <td className="num">{c.pedidos}</td>
                <td className="num">{plata(c.comprado)}</td>
                <td className="num hidden sm:table-cell">{total ? pct(c.comprado / total) : '—'}</td>
                <td className={`num hidden md:table-cell ${c.debe > 0 ? 'font-semibold text-pierde' : ''}`}>{c.debe > 0 ? plata(c.debe) : '—'}</td>
                <td className="hidden whitespace-nowrap text-tenue md:table-cell">{c.ultima ? fecha(c.ultima) : '—'}</td>
                <td className="w-11 !p-0">
                  <Enlace href={`/ventas/clientes?c=${c.id}`} aria-label={`Ver a ${c.nombre}`} className="flex min-h-11 min-w-11 items-center justify-center text-tenue hover:text-tinta">
                    <Icono nombre="siguiente" className="h-4 w-4" />
                  </Enlace>
                </td>
              </tr>
            ))}
          </tbody>
        </Tabla>
      )}
    </div>
  );

  let detalle = null;
  if (nuevo) {
    detalle = (
      <PanelDetalle titulo="Nuevo cliente" cerrar="/ventas/clientes">
        <Formulario accion={crearCliente} className="space-y-3">
          <CamposCliente />
          <Enviar className="boton w-full">Guardar cliente</Enviar>
        </Formulario>
        <p className="text-xs text-tenue">No hace falta crearlos antes: al cargar una venta con un nombre nuevo, el cliente se crea solo.</p>
      </PanelDetalle>
    );
  } else if (elegido) {
    const ventas = [...d.encargos, ...d.entregadas].filter((v) => v.cliente_id === elegido.id);
    detalle = (
      <PanelDetalle titulo={elegido.nombre} subtitulo={elegido.contacto} cerrar="/ventas/clientes">
        <dl className="grid grid-cols-3 gap-2 text-center">
          {[
            ['Compró', plata(elegido.comprado)],
            ['Te dejó', plata(elegido.ganancia)],
            ['Debe', plata(elegido.debe)],
          ].map(([n, v]) => (
            <div key={n} className="rounded-box bg-papel p-2">
              <dt className="text-[11px] text-tenue">{n}</dt>
              <dd className="font-bold">{v}</dd>
            </div>
          ))}
        </dl>
        <div>
          <p className="rotulo mb-2">Sus pedidos</p>
          {ventas.length === 0 ? (
            <p className="text-sm text-tenue">Todavía no compró.</p>
          ) : (
            <ul className="divide-y divide-linea text-sm">
              {ventas.map((v) => (
                <li key={v.id}>
                  <Enlace href={v.estado === 'encargo' ? '/ventas/encargos' : `/ventas/historial?v=${v.id}`} className="flex items-center justify-between gap-3 py-2 hover:text-primary">
                    <span className="min-w-0">
                      <span className="block truncate">{v.detalle}</span>
                      <span className="text-xs text-tenue">
                        {fecha(v.fecha)}
                        {v.estado === 'encargo' && ' · encargo'}
                        {v.saldo > 0 && v.estado !== 'encargo' && ` · debe ${plata(v.saldo)}`}
                      </span>
                    </span>
                    <span className="shrink-0 font-medium">{plata(v.total)}</span>
                  </Enlace>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="rotulo mb-2">Datos</p>
          <Formulario accion={editarCliente.bind(null, elegido.id)} limpiar={false} className="space-y-2">
            <CamposCliente c={elegido} />
            <Enviar className="boton-suave min-h-11 w-full">Guardar cambios</Enviar>
          </Formulario>
        </div>
        <div>
          <p className="rotulo mb-2">¿Es la misma persona que otro cliente?</p>
          <Formulario
            accion={unirClientes.bind(null, elegido.id)}
            confirmar={`¿Unir a ${elegido.nombre} con el cliente elegido? Sus ${elegido.pedidos + elegido.encargos} pedidos pasan al otro y ${elegido.nombre} se borra.`}
            limpiar={false}
            className="flex items-end gap-2"
          >
            <Campo nombre="Unir con" className="min-w-0 flex-1">
              <select name="destino" required defaultValue="" className="entrada">
                <option value="" disabled>
                  Elegí el cliente
                </option>
                {[...d.clientes]
                  .filter((c) => c.id !== elegido.id)
                  .sort((a, b) => Number(mismoCliente(b.nombre, elegido.nombre)) - Number(mismoCliente(a.nombre, elegido.nombre)) || a.nombre.localeCompare(b.nombre))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
              </select>
            </Campo>
            <Enviar className="boton-suave min-h-11">Unir</Enviar>
          </Formulario>
          <p className="mt-1 text-xs text-tenue">Sus pedidos pasan al cliente que elijas y este nombre desaparece. Los parecidos aparecen primero.</p>
        </div>
        <Accion accion={borrar.bind(null, 'clientes', elegido.id)} confirmar={`¿Borrar a ${elegido.nombre}? Sus ventas quedan, pero sin cliente.`} className="btn btn-outline btn-error btn-sm w-full">
          Borrar cliente
        </Accion>
      </PanelDetalle>
    );
  } else if (top.length) {
    detalle = (
      <div className="tarjeta flex h-full flex-col gap-4 p-4">
        <h2 className="rotulo">Los que más te compran</h2>
        <Ranking filas={top.map((c) => ({ nombre: c.nombre, nota: `${c.pedidos} pedido${c.pedidos === 1 ? '' : 's'}`, valor: c.comprado }))} total={total} />
        {repetidos.length > 0 && (
          <div className="rounded-box bg-papel p-3 text-sm">
            <p className="font-medium">Pueden ser la misma persona</p>
            <p className="text-xs text-tenue">Los pedidos del otro pasan al que elegís y el otro se borra. Te pregunta antes de unir.</p>
            <ul className="mt-2 space-y-3">
              {repetidos.slice(0, 5).map(([a, b]) => (
                <li key={`${a.id}-${b.id}`}>
                  <p>
                    {a.nombre} <span className="text-tenue">({a.pedidos + a.encargos})</span> y {b.nombre}{' '}
                    <span className="text-tenue">({b.pedidos + b.encargos})</span>. ¿Con cuál te quedás?
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {[
                      [a, b],
                      [b, a],
                    ].map(([queda, sale]) => (
                      <Formulario
                        key={queda.id}
                        accion={unirClientes.bind(null, sale.id)}
                        confirmar={`¿Quedarte con «${queda.nombre}»? Los ${sale.pedidos + sale.encargos} pedidos de «${sale.nombre}» pasan a «${queda.nombre}» y «${sale.nombre}» se borra.`}
                        limpiar={false}
                        className="inline"
                      >
                        <input type="hidden" name="destino" value={queda.id} />
                        <Enviar className="boton-suave min-h-11">Quedarme con «{queda.nombre}»</Enviar>
                      </Formulario>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-sm text-tenue">
          Estos {top.length} hacen el <strong className="text-tinta">{total ? Math.round((top5 / total) * 100) : 0}%</strong> de lo que vendiste. En un emprendimiento chico, cuidar a
          los que vuelven es lo que más rinde.
        </p>
      </div>
    );
  }

  return (
    <Pagina className="h-full">
      <ConDetalle lista={lista} detalle={detalle} abierto={Boolean(nuevo || elegido)} />
    </Pagina>
  );
}
