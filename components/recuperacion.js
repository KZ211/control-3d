import Link from 'next/link';
import { plata, pct } from '@/lib/formato';
import { Hoja, Cifra, Avance, Renglon, Explica } from './ui';

// Cuánto falta para que la ganancia neta pague el equipo. Con `detalle`
// muestra la cuenta completa: máquinas, cuotas y ganancia neta.
export default function Recuperacion({ rec, detalle = false }) {
  const recuperado = rec.falta <= 0;
  const cuotas = rec.enCuotas;
  return (
    <Hoja>
      {recuperado ? (
        <Cifra grande tono="gana" nombre="Ya recuperaste todo el equipo y vas" valor={`+${plata(-rec.falta)}`} />
      ) : (
        <Cifra grande nombre="Te falta recuperar" valor={plata(rec.falta)} />
      )}
      <p className="mt-1 text-sm text-tenue">
        Equipo {plata(rec.equipos)} · ganancia neta {plata(rec.neta)}
        {rec.porCobrar > 0 && ` · te deben ${plata(rec.porCobrar)}`}
      </p>
      <div className="mt-5">
        <Avance valor={rec.avance} etiqueta={`Recuperado ${pct(rec.avance)}`} />
        <p className="mt-2 text-sm text-tenue">Recuperado: {pct(rec.avance)}</p>
      </div>

      {detalle && (
        <div className="mt-6 grid gap-8 text-sm lg:grid-cols-2">
          <div>
            <p className="font-semibold uppercase tracking-wide text-tenue">El equipo</p>
            {rec.maquinas.map((c) => (
              <Renglon key={c.id} concepto={c.descripcion} monto={Number(c.total)} />
            ))}
            {cuotas.map((c) => (
              <Renglon
                key={c.id}
                concepto={`${c.descripcion} (en cuotas)`}
                monto={Number(c.total)}
                nota={`${c.cuotasPagadas} de ${c.cuotas} cuotas de ${plata(c.valorCuota)} · pagaste ${plata(c.pagado)}, faltan ${plata(c.debe)}`}
              />
            ))}
            <Renglon fuerte concepto="Total a recuperar" monto={rec.equipos} />
          </div>
          <div>
            <p className="font-semibold uppercase tracking-wide text-tenue">La ganancia neta</p>
            <Renglon concepto="Cobrado de las ventas" monto={rec.cobrado} nota="Suma de lo que cobraste (los redondeos)" />
            <Renglon concepto="Filamento de las piezas" monto={-rec.material} nota="Gramos × precio por gramo de cada pieza" />
            <Renglon fuerte concepto="Ganancia neta" monto={rec.neta} />
            <Renglon fuerte concepto={recuperado ? 'Por encima del equipo' : 'Falta recuperar'} monto={Math.abs(rec.falta)} />
            {rec.porCobrar > 0 && !recuperado && (
              <p className="mt-3 text-tenue">
                Cuando cobres los {plata(rec.porCobrar)} que te deben, faltarán {plata(Math.max(0, rec.falta - rec.porCobrar))}.
              </p>
            )}
          </div>
        </div>
      )}

      <Explica titulo="¿Cómo se calcula?">
        <p>
          Es la cuenta de tu planilla: la <strong>ganancia neta</strong> es todo lo que cobraste menos el filamento que llevó cada pieza (gramos ×
          precio por gramo). Esa ganancia es la que va pagando el <strong>equipo</strong>: las impresoras y el AMS.
        </p>
        <p>
          El filamento que comprás no entra en lo que hay que recuperar, porque ya lo paga el costo de cada pieza. Lo que está en cuotas cuenta
          entero desde el principio: es equipo que ya usás, aunque lo sigas pagando.
        </p>
        {!detalle && (
          <p>
            <Link href="/tu-plata" className="underline">
              Ver la cuenta completa
            </Link>
          </p>
        )}
      </Explica>
    </Hoja>
  );
}
