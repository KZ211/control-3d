import Enlace from '@/components/enlace';
import Icono from '@/components/iconos';
import { cargar } from '@/lib/datos';
import { plata, num, gramos, pct } from '@/lib/formato';
import { Pagina, Vacio, Campo, Explica, ConDetalle, PanelDetalle, Tabla } from '@/components/ui';
import { Accion, Formulario, Enviar } from '@/components/formulario';
import { borrar, crearProducto, editarProducto } from '@/app/acciones';

export const dynamic = 'force-dynamic';

function CamposProducto({ p = {} }) {
  return (
    <>
      <Campo nombre="Nombre" className="col-span-2">
        <input name="nombre" required defaultValue={p.nombre ?? ''} className="entrada" />
      </Campo>
      <Campo nombre="Gramos por unidad">
        <input name="gramos_unidad" inputMode="decimal" defaultValue={p.gramos_unidad != null ? Number(p.gramos_unidad) : ''} className="entrada" />
      </Campo>
      <Campo nombre="Horas por unidad">
        <input name="horas_unidad" inputMode="decimal" defaultValue={p.horas_unidad != null ? Number(p.horas_unidad) : ''} className="entrada" placeholder="Opcional" />
      </Campo>
      <Campo nombre="Tu precio por unidad" ayuda="Lo que cobrás normalmente." className="col-span-2">
        <input name="precio_unidad" inputMode="decimal" defaultValue={p.precio_unidad != null ? Number(p.precio_unidad) : ''} className="entrada" />
      </Campo>
    </>
  );
}

// Tu precio contra el sugerido y el de por mayor, en una sola regla.
function Precios({ p }) {
  const mayor = Math.max(p.sugerido, Number(p.precio_unidad) || 0, p.precioPromedio || 0) * 1.1 || 1;
  const marcas = [
    ['Costo', p.costoUnidad, 'bg-serie-3'],
    ['Por mayor', p.sugeridoMayor, 'bg-serie-2'],
    ['Sugerido', p.sugerido, 'bg-gana'],
  ];
  return (
    <div>
      <div className="relative h-3 rounded-full bg-linea">
        {marcas.map(([n, v, color]) => (
          <span key={n} className={`absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded ${color}`} style={{ left: `${(v / mayor) * 100}%` }} aria-hidden="true" />
        ))}
        {p.precio_unidad != null && (
          <span
            className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-hoja bg-acento"
            style={{ left: `${(Number(p.precio_unidad) / mayor) * 100}%` }}
            aria-hidden="true"
          />
        )}
      </div>
      <ul className="mt-3 space-y-1 text-sm">
        {marcas.map(([n, v, color]) => (
          <li key={n} className="flex items-center gap-2">
            <span className={`h-3 w-1 rounded ${color}`} aria-hidden="true" />
            <span className="flex-1 text-tenue">{n}</span>
            <span>{plata(v)}</span>
          </li>
        ))}
        {p.precio_unidad != null && (
          <li className="flex items-center gap-2 font-semibold">
            <span className="h-3 w-3 rounded-full bg-acento" aria-hidden="true" />
            <span className="flex-1">Tu precio</span>
            <span>{plata(p.precio_unidad)}</span>
          </li>
        )}
      </ul>
    </div>
  );
}

export default async function Productos({ searchParams }) {
  const d = await cargar();
  const { costoGramo, multiplicador, multiplicadorMayor } = d.ajustes;
  const elegido = d.productos.find((p) => p.id === searchParams?.p);
  const nuevo = searchParams?.p === 'nuevo';

  const lista = (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <p className="text-xs text-tenue">
          Sugerido = gramos × {plata(costoGramo)} × {num(multiplicador)} · por mayor × {num(multiplicadorMayor)}. En rojo, un precio por debajo del sugerido.
        </p>
        <Enlace href="/taller/productos?p=nuevo" className="boton-suave shrink-0">
          <Icono nombre="sumar" className="h-4 w-4" /> Producto
        </Enlace>
      </div>
      {d.productos.length === 0 ? (
        <Vacio>Agregá las piezas que repetís: aparecen como botones al cargar una venta.</Vacio>
      ) : (
        <Tabla className="min-h-0 flex-1">
          <thead>
            <tr>
              <th>Producto</th>
              <th className="num">Vendidas</th>
              <th className="num hidden md:table-cell">Facturado</th>
              <th className="num">Tu precio</th>
              <th className="num hidden sm:table-cell">Sugerido</th>
              <th className="num hidden sm:table-cell">Por mayor</th>
              <th>
                <span className="sr-only">Abrir</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {d.productos.map((p) => {
              const barato = p.precio_unidad != null && Number(p.precio_unidad) < p.sugerido;
              return (
                <tr key={p.id} className={elegido?.id === p.id ? 'bg-acento/10' : 'hover:bg-papel'}>
                  <td>
                    <Enlace href={`/taller/productos?p=${p.id}`} className="font-medium hover:underline">
                      {p.nombre}
                    </Enlace>
                    <span className="block text-xs text-tenue">
                      {gramos(p.gramos_unidad)} · costo {plata(p.costoUnidad)}
                    </span>
                  </td>
                  <td className="num">{num(p.unidades)}</td>
                  <td className="num hidden md:table-cell">{plata(p.facturado)}</td>
                  <td className={`num font-medium ${barato ? 'text-pierde' : ''}`}>{p.precio_unidad != null ? plata(p.precio_unidad) : '—'}</td>
                  <td className="num hidden sm:table-cell">{plata(p.sugerido)}</td>
                  <td className="num hidden sm:table-cell">{plata(p.sugeridoMayor)}</td>
                  <td className="w-8 !p-0">
                    <Enlace href={`/taller/productos?p=${p.id}`} aria-label={`Ver ${p.nombre}`} className="flex min-h-11 items-center justify-center text-tenue hover:text-tinta">
                      <Icono nombre="siguiente" className="h-4 w-4" />
                    </Enlace>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Tabla>
      )}
    </div>
  );

  let detalle = null;
  if (nuevo) {
    detalle = (
      <PanelDetalle titulo="Nuevo producto" cerrar="/taller/productos">
        <Formulario accion={crearProducto} className="grid grid-cols-2 gap-3">
          <CamposProducto />
          <Enviar className="boton col-span-2">Guardar producto</Enviar>
        </Formulario>
      </PanelDetalle>
    );
  } else if (elegido) {
    const p = elegido;
    detalle = (
      <PanelDetalle titulo={p.nombre} subtitulo={`${gramos(p.gramos_unidad)}${p.horas_unidad ? ` · ${num(p.horas_unidad)} h` : ''}`} cerrar="/taller/productos">
        <dl className="grid grid-cols-3 gap-2 text-center">
          {[
            ['Vendidas', num(p.unidades)],
            ['Facturado', plata(p.facturado)],
            ['Te dejó', plata(p.ganancia)],
          ].map(([n, v]) => (
            <div key={n} className="rounded-box bg-papel p-2">
              <dt className="text-[11px] text-tenue">{n}</dt>
              <dd className="font-bold">{v}</dd>
            </div>
          ))}
        </dl>
        <div>
          <p className="rotulo mb-2">Precios por unidad</p>
          <Precios p={p} />
          {p.unidades > 0 && (
            <p className="mt-2 text-xs text-tenue">
              Cobraste en promedio {plata(p.precioPromedio)} por unidad
              {p.facturado ? `, con un margen de ${pct(p.ganancia / p.facturado)}` : ''}.
            </p>
          )}
        </div>
        <div>
          <p className="rotulo mb-2">Datos</p>
          <Formulario accion={editarProducto.bind(null, p.id)} limpiar={false} className="grid grid-cols-2 gap-2">
            <CamposProducto p={p} />
            <Enviar className="boton-suave col-span-2 min-h-11">Guardar cambios</Enviar>
          </Formulario>
        </div>
        <Accion accion={borrar.bind(null, 'productos', p.id)} confirmar={`¿Borrar ${p.nombre}? Las ventas quedan, pero sin producto.`} className="btn btn-outline btn-error btn-sm w-full">
          Borrar producto
        </Accion>
      </PanelDetalle>
    );
  } else {
    detalle = (
      <div className="tarjeta h-full overflow-y-auto p-4">
        <h2 className="rotulo">¿Precio promedio o tu precio?</h2>
        <Explica titulo="Cómo leer la tabla">
          <p>
            <strong>Tu precio</strong> es el que cargaste en el producto. El <strong>promedio</strong> es lo que cobraste de verdad, por unidad: si es más bajo, estás
            haciendo descuentos por cantidad.
          </p>
          <p>
            El <strong>sugerido</strong> sigue la regla de tu planilla: el costo del filamento por un multiplicador. Ese margen tiene que cubrir la luz, el desgaste, las
            piezas que salen mal y tu tiempo. El de <strong>por mayor</strong> usa un multiplicador más bajo, para pedidos grandes o reventa.
          </p>
        </Explica>
        <p className="mt-3 text-sm text-tenue">Tocá un producto para ver sus números y editarlo.</p>
      </div>
    );
  }

  return (
    <Pagina className="h-full">
      <ConDetalle lista={lista} detalle={detalle} abierto={Boolean(nuevo || elegido)} />
    </Pagina>
  );
}
