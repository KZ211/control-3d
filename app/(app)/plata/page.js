import { cargar } from '@/lib/datos';
import { plata, pct } from '@/lib/formato';
import { Pagina, Explica, Renglon } from '@/components/ui';
import { Anillo } from '@/components/graficos';

export const dynamic = 'force-dynamic';

// Cuánto falta para que la ganancia neta pague el equipo, con la cuenta completa.
export default async function Recuperacion() {
  const d = await cargar();
  const rec = d.recuperacion;
  const recuperado = rec.falta <= 0;

  return (
    <Pagina className="lg:flex lg:h-full lg:flex-col">
      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-3">
        <section aria-labelledby="t-falta" className="tarjeta flex flex-col items-center justify-center gap-4 p-5 text-center">
          <h2 id="t-falta" className="rotulo">
            {recuperado ? 'Ya recuperaste todo el equipo' : 'Te falta recuperar'}
          </h2>
          <p className={`text-4xl font-bold tracking-tight ${recuperado ? 'text-gana' : ''}`}>{recuperado ? `+${plata(-rec.falta)}` : plata(rec.falta)}</p>
          <Anillo valor={rec.avance} tamano={200} grosor={18} etiqueta={`Recuperado ${pct(rec.avance)}`} tono={recuperado ? 'gana' : 'acento'}>
            <span className="text-5xl font-bold">{pct(rec.avance)}</span>
            <span className="text-xs text-tenue">recuperado</span>
          </Anillo>
          <p className="text-sm text-tenue">
            Ganancia neta {plata(rec.neta)} de {plata(rec.equipos)} de equipo
          </p>
          {rec.porCobrar > 0 && !recuperado && (
            <p className="rounded-box bg-papel px-3 py-2 text-xs text-tenue">
              Cuando cobres los {plata(rec.porCobrar)} que te deben, faltarán <strong className="text-tinta">{plata(Math.max(0, rec.falta - rec.porCobrar))}</strong>.
            </p>
          )}
        </section>

        <section aria-labelledby="t-equipo" className="tarjeta p-5 lg:overflow-y-auto">
          <h2 id="t-equipo" className="rotulo mb-2">
            El equipo · {plata(rec.equipos)}
          </h2>
          {rec.maquinas.map((c) => (
            <Renglon key={c.id} concepto={c.descripcion} monto={Number(c.total)} />
          ))}
          {rec.enCuotas.map((c) => (
            <div key={c.id} className="border-b border-linea py-2">
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span>
                  {c.descripcion} <span className="badge badge-ghost badge-sm">en cuotas</span>
                </span>
                <span>{plata(c.total)}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <progress className="progress progress-success h-2 flex-1" value={c.cuotasPagadas} max={c.cuotas} aria-label={`${c.cuotasPagadas} de ${c.cuotas} cuotas pagadas`} />
                <span className="text-xs font-semibold">
                  {c.cuotasPagadas}/{c.cuotas}
                </span>
              </div>
              <p className="mt-1 text-xs text-tenue">
                Cuotas de {plata(c.valorCuota)} · pagaste {plata(c.pagado)}, faltan {plata(c.debe)}
              </p>
            </div>
          ))}
          <Renglon fuerte concepto="Total a recuperar" monto={rec.equipos} />
        </section>

        <section aria-labelledby="t-neta" className="tarjeta p-5 lg:overflow-y-auto">
          <h2 id="t-neta" className="rotulo mb-2">
            La ganancia neta · {plata(rec.neta)}
          </h2>
          <Renglon concepto="Cobrado de las ventas" monto={rec.cobrado} nota="La suma de lo que cobraste (los redondeos)" />
          <Renglon concepto="Filamento de las piezas" monto={-rec.material} nota="Gramos × precio por gramo de cada pieza" />
          <Renglon fuerte concepto="Ganancia neta" monto={rec.neta} />
          <div className="mt-4 rounded-box bg-papel p-3 text-sm">
            <div className="flex justify-between">
              <span>De cada $100 cobrados</span>
              <strong>{plata(rec.cobrado ? (rec.neta / rec.cobrado) * 100 : 0)} son ganancia</strong>
            </div>
          </div>
          <Explica titulo="¿Cómo se calcula?">
            <p>
              Es la cuenta de tu planilla: la <strong>ganancia neta</strong> es todo lo que cobraste menos el filamento que llevó cada pieza. Esa ganancia es la que va
              pagando el <strong>equipo</strong>: las impresoras y el AMS.
            </p>
            <p>
              El filamento que comprás no entra en lo que hay que recuperar, porque ya lo paga el costo de cada pieza. Lo que está en cuotas cuenta entero desde el
              principio: es equipo que ya usás, aunque lo sigas pagando.
            </p>
          </Explica>
        </section>
      </div>
    </Pagina>
  );
}
