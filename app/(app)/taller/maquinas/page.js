import Link from 'next/link';
import { cargar } from '@/lib/datos';
import { plata, plataFina, num, pct, hoy } from '@/lib/formato';
import { Pagina, Explica, Campo } from '@/components/ui';
import { Anillo } from '@/components/graficos';
import { Accion, Formulario, Enviar } from '@/components/formulario';
import { borrar, crearMaquina, editarMaquina } from '@/app/acciones';

export const dynamic = 'force-dynamic';

export default async function Maquinas() {
  const d = await cargar();

  return (
    <Pagina>
      <p className="rounded-box border border-acento/40 bg-acento/10 px-4 py-3 text-sm">
        La recuperación es una sola para todo el equipo: hoy falta <strong>{plata(Math.max(0, d.recuperacion.falta))}</strong> ({pct(d.recuperacion.avance)}{' '}
        recuperado).{' '}
        <Link href="/plata" className="font-semibold underline">
          Ver la cuenta
        </Link>
      </p>

      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {d.maquinas.map((m) => {
          const uso = m.vida_util_horas ? m.horas / m.vida_util_horas : 0;
          return (
            <li key={m.id} className="tarjeta p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold">{m.nombre}</h2>
                <Accion accion={borrar.bind(null, 'maquinas', m.id)} confirmar={`¿Borrar ${m.nombre}? Sus compras e impresiones quedan, pero sin máquina.`}>
                  Borrar
                </Accion>
              </div>
              <div className="mt-3 flex items-center gap-5">
                <Anillo valor={uso} tamano={96} grosor={10} etiqueta={`Vida usada ${pct(uso)}`} tono="acento">
                  <span className="text-lg font-bold">{pct(uso)}</span>
                  <span className="text-[10px] text-tenue">de vida</span>
                </Anillo>
                <dl className="grid flex-1 grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <div>
                    <dt className="text-xs text-tenue">Costó</dt>
                    <dd className="font-semibold">{plata(m.precio)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-tenue">Le queda</dt>
                    <dd className="font-semibold">{plata(Math.max(0, m.precio - m.horas * m.porHora))}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-tenue">Horas</dt>
                    <dd>
                      {num(m.horas)} / {num(m.vida_util_horas)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-tenue">Desgaste/hora</dt>
                    <dd>{plataFina(m.porHora)}</dd>
                  </div>
                </dl>
              </div>
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-medium text-primary">Vida útil y consumo</summary>
                <Formulario accion={editarMaquina.bind(null, m.id)} limpiar={false} className="mt-2 flex items-end gap-2">
                  <Campo nombre="Vida útil (h)" className="flex-1">
                    <input name="vida_util_horas" inputMode="numeric" defaultValue={m.vida_util_horas} className="entrada" />
                  </Campo>
                  <Campo nombre="Consumo (W)" className="flex-1">
                    <input name="consumo_watts" inputMode="numeric" defaultValue={m.consumo_watts} className="entrada" />
                  </Campo>
                  <Enviar className="boton-suave min-h-11">OK</Enviar>
                </Formulario>
              </details>
            </li>
          );
        })}

        <li className="tarjeta border-dashed p-5">
          <h2 className="text-lg font-semibold">Nueva máquina</h2>
          <Formulario accion={crearMaquina} className="mt-3 grid grid-cols-2 gap-2">
            <Campo nombre="Nombre" className="col-span-2">
              <input name="nombre" required className="entrada" placeholder="Ej: Bambu Lab P1S" />
            </Campo>
            <Campo nombre="Vida útil (h)">
              <input name="vida_util_horas" inputMode="numeric" defaultValue="5000" className="entrada" />
            </Campo>
            <Campo nombre="Consumo (W)">
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
            <Campo nombre="Cuotas">
              <input name="cuotas" inputMode="numeric" className="entrada" placeholder="Si es en cuotas" />
            </Campo>
            <Enviar className="boton col-span-2">Guardar máquina</Enviar>
          </Formulario>
        </li>
      </ul>

      <Explica titulo="¿Qué es la vida útil y el desgaste?">
        <p>
          La <strong>vida útil</strong> es cuántas horas esperás que dure la impresora. Repartir el precio entre esas horas da el <strong>desgaste por hora</strong>: lo
          que “gasta” de la máquina cada hora de impresión. Sirve para saber cuánto vale hoy y cuánto te cuesta de verdad una pieza larga.
        </p>
        <p>La recuperación no usa el desgaste: compara la ganancia neta con el precio entero del equipo, como en tu planilla.</p>
      </Explica>
    </Pagina>
  );
}
