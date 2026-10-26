import { cargar } from '@/lib/datos';
import { plata, fecha, hoy } from '@/lib/formato';
import { Pagina, Vacio, Explica, Campo, Renglon } from '@/components/ui';
import { Reparto } from '@/components/graficos';
import { Accion, Formulario, Enviar } from '@/components/formulario';
import { borrar, moverCapital } from '@/app/acciones';

export const dynamic = 'force-dynamic';

export default async function TuBolsillo() {
  const d = await cargar();
  const bol = d.bolsillo;
  const compras = d.compras.filter((c) => c.forma_pago === 'bolsillo').reduce((s, c) => s + Number(c.total), 0);
  const cuotas = d.compras
    .flatMap((c) => c.pagos)
    .filter((p) => p.pagado_con === 'bolsillo')
    .reduce((s, p) => s + Number(p.monto), 0);
  const aportes = d.capital.filter((m) => m.tipo === 'aporte').reduce((s, m) => s + Number(m.monto), 0);

  return (
    <Pagina className="lg:flex lg:h-full lg:flex-col">
      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-3">
        <section aria-labelledby="t-pusiste" className="tarjeta p-5 lg:overflow-y-auto">
          <h2 id="t-pusiste" className="text-sm text-tenue">
            Pusiste de tu bolsillo
          </h2>
          <p className="text-4xl font-bold tracking-tight">{plata(bol.aportado)}</p>
          <div className="mt-4">
            <Reparto
              etiqueta="En qué pusiste tu plata"
              partes={[
                { nombre: 'Compras', valor: compras },
                { nombre: 'Cuotas', valor: cuotas },
                { nombre: 'Aportes a la caja', valor: aportes },
              ]}
            />
          </div>
          <div className="mt-4">
            <Renglon concepto="Ya sacaste (retiros)" monto={bol.retirado} />
            {bol.gastado > 0 && (
              <>
                <Renglon concepto="De eso gastaste" monto={-bol.gastado} nota="Ya no está ni en la caja ni con vos" />
                <Renglon concepto="Lo tenés vos" monto={bol.retirado - bol.gastado} nota="Lo que sacaste y todavía no gastaste" />
              </>
            )}
            <Renglon concepto="Está en la caja" monto={bol.caja} nota="La podés sacar cuando quieras" />
          </div>
          <Explica titulo="¿Y la recuperación?">
            <p>
              La recuperación mide si el negocio ya pagó el equipo. Esto es otra cosa: cuánta plata tuya salió y cuánta volvió a tus manos. Podés haber recuperado el
              equipo con la ganancia y tener esa plata todavía en la caja, sin haberla sacado.
            </p>
          </Explica>
        </section>

        <section aria-labelledby="t-mover" className="tarjeta p-5 lg:overflow-y-auto">
          <h2 id="t-mover" className="rotulo mb-3">
            Registrar un movimiento
          </h2>
          <Formulario accion={moverCapital} className="grid gap-3 sm:grid-cols-2">
            <Campo nombre="Tipo" className="sm:col-span-2">
              <select name="tipo" className="entrada" defaultValue="retiro">
                <option value="retiro">Retiro: saco plata de la caja para mí</option>
                <option value="aporte">Aporte: pongo plata mía en la caja</option>
                <option value="gasto">Gastado: gasté plata que ya había sacado (no toca la caja)</option>
              </select>
            </Campo>
            <Campo nombre="Monto">
              <input name="monto" inputMode="decimal" required className="entrada" />
            </Campo>
            <Campo nombre="Fecha">
              <input name="fecha" type="date" defaultValue={hoy()} required className="entrada" />
            </Campo>
            <Campo nombre="Nota" className="sm:col-span-2">
              <input name="nota" className="entrada" />
            </Campo>
            <div className="sm:col-span-2">
              <Enviar className="boton w-full">Guardar</Enviar>
            </div>
          </Formulario>
          <Explica titulo="¿Aporte, retiro o gastado?">
            <p>
              Lo que pusiste de tu liquidación es <strong>capital</strong>: plata tuya invertida que querés que vuelva. Vuelve cuando hacés un <strong>retiro</strong>:
              sacás plata de la caja para vos. Si gastás plata de las ventas en algo personal, también es un retiro.
            </p>
            <p>
              Un <strong>aporte</strong> es lo contrario: ponés plata tuya en la caja. Si pagás una compra directo de tu bolsillo, no hace falta: marcala como “de mi
              bolsillo” en Compras.
            </p>
            <p>
              <strong>Gastado</strong> es plata que ya habías sacado de la caja con un retiro y gastaste: sale de tu bolsillo, no de la caja. Así ves cuánto de lo que
              sacaste todavía tenés. Las compras del emprendimiento (filamento, repuestos) no van acá: cargalas en Compras pagadas con la caja.
            </p>
          </Explica>
        </section>

        <section aria-labelledby="t-movs" className="tarjeta flex flex-col p-5 lg:min-h-0">
          <h2 id="t-movs" className="rotulo mb-2">
            Aportes, retiros y gastado
          </h2>
          {d.capital.length === 0 ? (
            <Vacio>Todavía no registraste aportes, retiros ni gastado.</Vacio>
          ) : (
            <ul className="min-h-0 flex-1 divide-y divide-linea overflow-y-auto">
              {d.capital.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span>
                    <span className="font-medium">{m.tipo === 'aporte' ? 'Aporte' : m.tipo === 'gasto' ? 'Gastado' : 'Retiro'}</span> · {fecha(m.fecha)}
                    {m.nota && <span className="block text-xs text-tenue">{m.nota}</span>}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={m.tipo === 'retiro' ? 'text-gana' : m.tipo === 'gasto' ? 'text-tenue' : ''}>{plata(m.monto)}</span>
                    <Accion accion={borrar.bind(null, 'capital', m.id)} confirmar="¿Borrar este movimiento?">
                      ✕
                    </Accion>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Pagina>
  );
}
