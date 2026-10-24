import { cargar } from '@/lib/datos';
import { plata, num, gramos } from '@/lib/formato';
import { Pagina, Seccion, Hoja, Vacio, Campo, Explica } from '@/components/ui';
import { Accion, Formulario, Enviar } from '@/components/formulario';
import { borrar, crearProducto, editarProducto } from '../../acciones';

export const dynamic = 'force-dynamic';

function CamposProducto({ p = {} }) {
  return (
    <>
      <Campo nombre="Nombre">
        <input name="nombre" required defaultValue={p.nombre ?? ''} className="entrada" />
      </Campo>
      <Campo nombre="Gramos por unidad">
        <input name="gramos_unidad" inputMode="decimal" defaultValue={p.gramos_unidad != null ? Number(p.gramos_unidad) : ''} className="entrada" />
      </Campo>
      <Campo nombre="Horas por unidad" ayuda="Opcional, del laminador.">
        <input name="horas_unidad" inputMode="decimal" defaultValue={p.horas_unidad != null ? Number(p.horas_unidad) : ''} className="entrada" />
      </Campo>
      <Campo nombre="Precio por unidad" ayuda="Lo que cobrás normalmente.">
        <input name="precio_unidad" inputMode="decimal" defaultValue={p.precio_unidad != null ? Number(p.precio_unidad) : ''} className="entrada" />
      </Campo>
    </>
  );
}

export default async function Productos() {
  const d = await cargar();
  const { costoGramo, multiplicador, multiplicadorMayor } = d.ajustes;

  return (
    <Pagina titulo="Productos" bajada="Las piezas que más vendés: cuánto salieron, cuánto dejaron y a cuánto conviene venderlas.">
      <Seccion titulo="Catálogo">
        {d.productos.length === 0 ? (
          <Vacio>Agregá las piezas que repetís para cargar ventas más rápido y ver cuánto deja cada una.</Vacio>
        ) : (
          <div className="overflow-x-auto border border-linea bg-hoja">
            <table className="tabla min-w-[66rem]">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="num">Vendidas</th>
                  <th className="num">Facturado</th>
                  <th className="num">Te dejó</th>
                  <th className="num">Precio promedio</th>
                  <th className="num">Tu precio</th>
                  <th className="num">Costo c/u</th>
                  <th className="num">Sugerido</th>
                  <th className="num">Por mayor</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {d.productos.map((p) => {
                  const barato = p.precio_unidad != null && Number(p.precio_unidad) < p.sugerido;
                  return (
                    <tr key={p.id}>
                      <td>
                        <span className="font-medium">{p.nombre}</span>
                        <span className="block text-xs text-tenue">
                          {gramos(p.gramos_unidad)}
                          {p.horas_unidad ? ` · ${num(p.horas_unidad)} h` : ''}
                        </span>
                      </td>
                      <td className="num">{num(p.unidades)}</td>
                      <td className="num">{plata(p.facturado)}</td>
                      <td className="num">{plata(p.ganancia)}</td>
                      <td className="num">{p.unidades ? plata(p.precioPromedio) : '—'}</td>
                      <td className={`num ${barato ? 'text-pierde' : ''}`}>{p.precio_unidad != null ? plata(p.precio_unidad) : '—'}</td>
                      <td className="num">{plata(p.costoUnidad)}</td>
                      <td className="num font-semibold">{plata(p.sugerido)}</td>
                      <td className="num">{plata(p.sugeridoMayor)}</td>
                      <td>
                        <details className="text-sm">
                          <summary className="boton-suave cursor-pointer list-none">Editar</summary>
                          <div className="mt-2 w-64 space-y-3 border border-linea bg-papel p-3">
                            <Formulario accion={editarProducto.bind(null, p.id)} limpiar={false} className="space-y-2">
                              <CamposProducto p={p} />
                              <Enviar className="boton-suave min-h-11">Guardar</Enviar>
                            </Formulario>
                            <Accion accion={borrar.bind(null, 'productos', p.id)} confirmar={`¿Borrar ${p.nombre}? Las ventas quedan, pero sin producto.`}>
                              Borrar producto
                            </Accion>
                          </div>
                        </details>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-sm text-tenue">
          Costo c/u = gramos × {plata(costoGramo)} por gramo · sugerido = costo × {num(multiplicador)}, por mayor × {num(multiplicadorMayor)}. En rojo, un precio por debajo del sugerido.
          Lo cambiás en Ajustes.
        </p>
      </Seccion>

      <Seccion titulo="Nuevo producto">
        <Hoja>
          <Formulario accion={crearProducto} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CamposProducto />
            <div className="sm:col-span-2 lg:col-span-4">
              <Enviar>Guardar producto</Enviar>
            </div>
          </Formulario>
          <Explica titulo="¿Precio promedio o tu precio?">
            <p>
              <strong>Tu precio</strong> es el que cargaste en el producto. El <strong>promedio</strong> es lo que cobraste de verdad, por unidad: si
              es más bajo, estás haciendo descuentos por cantidad (por ejemplo, 6 portafiguritas a $3.500 en vez de $4.000).
            </p>
            <p>
              El <strong>sugerido</strong> sigue la regla de tu planilla: el costo del filamento por un multiplicador. Ese margen tiene que cubrir la
              luz, el desgaste de la máquina, las piezas que salen mal y tu tiempo.
            </p>
          </Explica>
        </Hoja>
      </Seccion>
    </Pagina>
  );
}
