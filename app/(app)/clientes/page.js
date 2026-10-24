import Link from 'next/link';
import { cargar } from '@/lib/datos';
import { plata, fecha } from '@/lib/formato';
import { Pagina, Seccion, Hoja, Vacio, Campo, Explica } from '@/components/ui';
import { Accion, Formulario, Enviar } from '@/components/formulario';
import { borrar, crearCliente, editarCliente } from '../../acciones';

export const dynamic = 'force-dynamic';

export default async function Clientes() {
  const d = await cargar();
  const conVentas = d.clientes.filter((c) => c.pedidos || c.encargos);
  const total = conVentas.reduce((s, c) => s + c.comprado, 0);
  const deben = d.clientes.filter((c) => c.debe > 0);

  return (
    <Pagina titulo="Clientes" bajada="Quién te compra, cuánto y quién te debe.">
      <div className="grid grid-cols-2 gap-px border border-linea bg-linea md:grid-cols-3">
        <div className="bg-hoja p-4">
          <p className="text-sm text-tenue">Clientes que compraron</p>
          <p className="mt-1 text-2xl font-bold">{conVentas.length}</p>
        </div>
        <div className="bg-hoja p-4">
          <p className="text-sm text-tenue">Vuelven a comprar</p>
          <p className="mt-1 text-2xl font-bold">{conVentas.filter((c) => c.pedidos > 1).length}</p>
          <p className="mt-1 text-sm text-tenue">con más de un pedido</p>
        </div>
        <div className="col-span-2 bg-hoja p-4 md:col-span-1">
          <p className="text-sm text-tenue">Te deben</p>
          <p className="mt-1 text-2xl font-bold">{plata(deben.reduce((s, c) => s + c.debe, 0))}</p>
          <p className="mt-1 text-sm text-tenue">{deben.map((c) => c.nombre).join(', ') || 'Nadie'}</p>
        </div>
      </div>

      <Seccion titulo="Todos">
        {d.clientes.length === 0 ? (
          <Vacio>Los clientes se crean solos al cargar una venta, o podés agregarlos abajo.</Vacio>
        ) : (
          <div className="overflow-x-auto border border-linea bg-hoja">
            <table className="tabla min-w-[48rem]">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th className="num">Pedidos</th>
                  <th className="num">Compró</th>
                  <th className="num">Parte del total</th>
                  <th className="num">Te deja</th>
                  <th className="num">Debe</th>
                  <th>Última</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {d.clientes.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/ventas?cliente=${c.id}`} className="font-medium hover:underline">
                        {c.nombre}
                      </Link>
                      {(c.contacto || c.encargos > 0) && (
                        <span className="block text-xs text-tenue">
                          {[c.contacto, c.encargos && `${c.encargos} encargo${c.encargos > 1 ? 's' : ''}`].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </td>
                    <td className="num">{c.pedidos}</td>
                    <td className="num">{plata(c.comprado)}</td>
                    <td className="num">{total ? `${((c.comprado / total) * 100).toFixed(1).replace('.', ',')} %` : '—'}</td>
                    <td className="num">{plata(c.ganancia)}</td>
                    <td className={`num ${c.debe > 0 ? 'font-semibold text-pierde' : ''}`}>{c.debe > 0 ? plata(c.debe) : '—'}</td>
                    <td className="whitespace-nowrap">{c.ultima ? fecha(c.ultima) : '—'}</td>
                    <td>
                      <details className="text-sm">
                        <summary className="boton-suave cursor-pointer list-none">Editar</summary>
                        <div className="mt-2 w-64 space-y-3 border border-linea bg-papel p-3">
                          <Formulario accion={editarCliente.bind(null, c.id)} limpiar={false} className="space-y-2">
                            <Campo nombre="Nombre">
                              <input name="nombre" required defaultValue={c.nombre} className="entrada" />
                            </Campo>
                            <Campo nombre="Contacto">
                              <input name="contacto" defaultValue={c.contacto ?? ''} className="entrada" placeholder="Teléfono, Instagram…" />
                            </Campo>
                            <Campo nombre="Notas">
                              <input name="notas" defaultValue={c.notas ?? ''} className="entrada" />
                            </Campo>
                            <Enviar className="boton-suave min-h-11">Guardar</Enviar>
                          </Formulario>
                          <Accion accion={borrar.bind(null, 'clientes', c.id)} confirmar={`¿Borrar a ${c.nombre}? Sus ventas quedan, pero sin cliente.`}>
                            Borrar cliente
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

      <Seccion titulo="Nuevo cliente">
        <Hoja>
          <Formulario accion={crearCliente} className="grid gap-4 sm:grid-cols-3">
            <Campo nombre="Nombre">
              <input name="nombre" required className="entrada" />
            </Campo>
            <Campo nombre="Contacto">
              <input name="contacto" className="entrada" placeholder="Teléfono, Instagram…" />
            </Campo>
            <Campo nombre="Notas">
              <input name="notas" className="entrada" />
            </Campo>
            <div className="sm:col-span-3">
              <Enviar>Guardar cliente</Enviar>
            </div>
          </Formulario>
          <Explica titulo="¿Para qué sirve?">
            <p>
              Ver quién te compra más te dice a quién cuidar: en un emprendimiento chico, unos pocos clientes que vuelven suelen hacer la mayor parte
              de las ventas. “Te deja” es la ganancia de sus pedidos después del costo.
            </p>
            <p>Si un mismo cliente quedó con dos nombres (por ejemplo “Holy cel” y “Marcos holycel”), cambiá el nombre en sus ventas desde “Editar”.</p>
          </Explica>
        </Hoja>
      </Seccion>
    </Pagina>
  );
}
