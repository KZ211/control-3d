import Link from 'next/link';
import { cargar } from '@/lib/datos';
import { plata, plataFina, num, pct, hoy } from '@/lib/formato';
import { Pagina, Seccion, Hoja, Vacio, Explica, Avance, Campo } from '@/components/ui';
import { Accion, Formulario, Enviar } from '@/components/formulario';
import { borrar, crearMaquina, editarMaquina } from '../../acciones';

export const dynamic = 'force-dynamic';

export default async function Maquinas() {
  const d = await cargar();

  return (
    <Pagina titulo="Máquinas" bajada="Cuánto costó cada impresora (con sus accesorios) y cuánto se usó.">
      <p className="border-l-4 border-acento bg-hoja p-4 text-sm">
        La recuperación es una sola para todo el equipo: la ganancia neta contra lo que costaron las máquinas y el AMS. Hoy falta{' '}
        <strong>{plata(Math.max(0, d.recuperacion.falta))}</strong>.{' '}
        <Link href="/tu-plata" className="font-semibold underline">
          Ver la cuenta
        </Link>
        .
      </p>
      {d.maquinas.length === 0 ? (
        <Vacio>Cargá tu primera impresora abajo.</Vacio>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {d.maquinas.map((m) => {
            const uso = m.vida_util_horas ? m.horas / m.vida_util_horas : 0;
            return (
              <Hoja key={m.id}>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-semibold">{m.nombre}</h2>
                  <Accion
                    accion={borrar.bind(null, 'maquinas', m.id)}
                    confirmar={`¿Borrar ${m.nombre}? Sus compras e impresiones quedan, pero sin máquina.`}
                  >
                    Borrar
                  </Accion>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-tenue">Costó</dt>
                    <dd className="text-lg font-semibold">{plata(m.precio)}</dd>
                  </div>
                  <div>
                    <dt className="text-tenue">Le queda</dt>
                    <dd className="text-lg font-semibold">{plata(Math.max(0, m.precio - m.horas * m.porHora))}</dd>
                  </div>
                  <div>
                    <dt className="text-tenue">Vida usada</dt>
                    <dd className="text-lg font-semibold">{pct(uso)}</dd>
                  </div>
                  <div>
                    <dt className="text-tenue">Horas impresas</dt>
                    <dd>
                      {num(m.horas)} de {num(m.vida_util_horas)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-tenue">Desgaste por hora</dt>
                    <dd>{plataFina(m.porHora)}</dd>
                  </div>
                  <div>
                    <dt className="text-tenue">Impresiones</dt>
                    <dd>{m.impresiones}</dd>
                  </div>
                </dl>
                <div className="mt-4">
                  <Avance valor={uso} etiqueta={`${m.nombre}: vida usada ${pct(uso)}`} />
                </div>
                <Formulario accion={editarMaquina.bind(null, m.id)} limpiar={false} className="mt-5 flex flex-wrap items-end gap-2 border-t border-linea pt-4">
                  <Campo nombre="Vida útil (horas)">
                    <input name="vida_util_horas" inputMode="numeric" defaultValue={m.vida_util_horas} className="entrada w-32" />
                  </Campo>
                  <Campo nombre="Consumo (watts)">
                    <input name="consumo_watts" inputMode="numeric" defaultValue={m.consumo_watts} className="entrada w-32" />
                  </Campo>
                  <Enviar className="boton-suave min-h-11">Actualizar</Enviar>
                </Formulario>
              </Hoja>
            );
          })}
        </div>
      )}

      <Seccion titulo="Nueva máquina">
        <Hoja>
          <Formulario accion={crearMaquina} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Campo nombre="Nombre" className="sm:col-span-2">
              <input name="nombre" required className="entrada" placeholder="Ej: Bambu Lab P1S" />
            </Campo>
            <Campo nombre="Vida útil (horas)" ayuda="Si no sabés, 5.000 es un número razonable.">
              <input name="vida_util_horas" inputMode="numeric" defaultValue="5000" className="entrada" />
            </Campo>
            <Campo nombre="Consumo promedio (watts)" ayuda="Aprox.: A1 y A1 mini 100 W, Ender 3 150 W.">
              <input name="consumo_watts" inputMode="numeric" defaultValue="150" className="entrada" />
            </Campo>
            <Campo nombre="Precio" ayuda="Opcional: también registra la compra.">
              <input name="precio" inputMode="decimal" className="entrada" />
            </Campo>
            <Campo nombre="Fecha de compra">
              <input name="fecha" type="date" defaultValue={hoy()} className="entrada" />
            </Campo>
            <Campo nombre="Pagada con">
              <select name="forma_pago" className="entrada" defaultValue="bolsillo">
                <option value="bolsillo">Mi bolsillo</option>
                <option value="caja">La caja</option>
                <option value="cuotas">Cuotas</option>
              </select>
            </Campo>
            <Campo nombre="Cuotas" ayuda="Solo si es en cuotas.">
              <input name="cuotas" inputMode="numeric" className="entrada" />
            </Campo>
            <div className="sm:col-span-2 lg:col-span-4">
              <Enviar>Guardar máquina</Enviar>
            </div>
          </Formulario>
          <Explica titulo="¿Qué es la vida útil y el desgaste?">
            <p>
              La <strong>vida útil</strong> es cuántas horas esperás que dure la impresora. Repartir el precio entre esas horas da el{' '}
              <strong>desgaste por hora</strong>: lo que “gasta” de la máquina cada hora de impresión. Sirve para saber cuánto vale hoy (“le queda”)
              y cuánto te cuesta de verdad una pieza larga.
            </p>
            <p>
              La recuperación no usa el desgaste: compara la ganancia neta con el precio entero del equipo, como en tu planilla. Las horas se suman
              cuando cargás impresiones con su máquina.
            </p>
          </Explica>
        </Hoja>
      </Seccion>
    </Pagina>
  );
}
