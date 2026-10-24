import { cargar } from '@/lib/datos';
import { plata, pct } from '@/lib/formato';
import { Pagina, Explica, Renglon } from '@/components/ui';
import { Anillo } from '@/components/graficos';

export const dynamic = 'force-dynamic';

export default async function Reinversion() {
  const d = await cargar();
  const re = d.reinversion;
  const usado = re.apartar ? Math.min(1, re.reinvertido / re.apartar) : 0;

  return (
    <Pagina className="lg:flex lg:h-full lg:flex-col">
      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-2">
        <section aria-labelledby="t-disp" className="tarjeta flex flex-col items-center justify-center gap-4 p-5 text-center">
          <h2 id="t-disp" className="rotulo">
            Disponible para reinvertir
          </h2>
          <p className="text-4xl font-bold tracking-tight">{plata(re.disponible)}</p>
          <Anillo valor={usado} tamano={170} grosor={16} etiqueta={`Ya reinvertiste ${pct(usado)} de lo apartado`} tono="acento">
            <span className="text-4xl font-bold">{pct(usado)}</span>
            <span className="text-xs text-tenue">ya reinvertido</span>
          </Anillo>
          <p className="max-w-xs text-sm text-tenue">
            Apartás el {pct(re.pct / 100)} de cada cobro para volver a comprar filamento. Lo cambiás en Ajustes.
          </p>
        </section>

        <section aria-labelledby="t-cuenta" className="tarjeta p-5 lg:overflow-y-auto">
          <h2 id="t-cuenta" className="rotulo mb-2">
            La cuenta
          </h2>
          <Renglon concepto={`${pct(re.pct / 100)} de lo cobrado`} monto={re.apartar} nota="Lo que apartás para filamento" />
          <Renglon concepto="Ya comprado con la caja" monto={-re.reinvertido} nota="Compras y cuotas pagadas con plata de las ventas" />
          <Renglon fuerte concepto="Disponible para reinvertir" monto={re.disponible} />
          {d.propias.cantidad > 0 && (
            <p className="mt-4 rounded-box bg-papel p-3 text-sm">
              Además imprimiste {d.propias.cantidad} cosas para vos y la familia: te costaron {plata(d.propias.costo)} y comprarlas valdría {plata(d.propias.valor)}.
              Te ahorraste <strong className="text-gana">{plata(d.propias.valor - d.propias.costo)}</strong>.
            </p>
          )}
          <Explica titulo="¿Qué es reinvertir?">
            <p>
              Tu planilla separa cada venta en dos: un {pct(re.pct / 100)} para <strong>reinvertir</strong> (volver a comprar filamento) y el resto, que llama neto.
              Apartar una parte fija es una buena costumbre: así nunca te quedás sin material por haber gastado todo lo cobrado.
            </p>
            <p>
              Ojo: ese neto no es la ganancia. La ganancia es lo cobrado menos lo que costó de verdad cada pieza (en el Panel). Si alguna compra de filamento la pagaste
              con plata de las ventas, cambiala a “caja” en Compras y se descuenta acá.
            </p>
          </Explica>
        </section>
      </div>
    </Pagina>
  );
}
