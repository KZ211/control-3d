import Enlace from '@/components/enlace';
import Icono from '@/components/iconos';
import { cargar } from '@/lib/datos';
import { resultado, gananciaNeta } from '@/lib/calculos';
import { plata, pct, gramos, hoy, nombreMes, moverMes } from '@/lib/formato';
import { Pagina, Explica, Renglon, Dato } from '@/components/ui';
import { Anillo, Reparto } from '@/components/graficos';

export const dynamic = 'force-dynamic';

export default async function Mes({ searchParams }) {
  const d = await cargar();
  const mes = /^\d{4}-\d{2}$/.test(searchParams?.mes ?? '') ? searchParams.mes : hoy().slice(0, 7);
  const r = resultado(d, `${mes}-01`, `${mes}-31`);
  const neta = gananciaNeta(d, `${mes}-01`, `${mes}-31`);
  const total = resultado(d);
  const otros = r.gastosVenta + r.impresionesSinVenta + r.otros;

  return (
    <Pagina className="lg:flex lg:h-full lg:flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div className="join">
          <Enlace className="btn join-item btn-sm border-linea bg-hoja" href={`/panel/mes?mes=${moverMes(mes, -1)}`} aria-label="Mes anterior">
            <Icono nombre="anterior" className="h-4 w-4" />
          </Enlace>
          <span className="join-item flex min-w-36 items-center justify-center border-y border-linea bg-hoja px-3 text-sm font-semibold capitalize">{nombreMes(mes)}</span>
          <Enlace className="btn join-item btn-sm border-linea bg-hoja" href={`/panel/mes?mes=${moverMes(mes, 1)}`} aria-label="Mes siguiente">
            <Icono nombre="siguiente" className="h-4 w-4" />
          </Enlace>
        </div>
        <p className="hidden text-sm text-tenue sm:block">
          Desde el principio: vendiste {plata(total.bruto)} y ganaste {plata(total.ganancia)} ({pct(total.margen)}).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Dato nombre="Vendiste" valor={plata(r.bruto)} nota={`${r.cantidad} ventas · ${r.unidades} unidades`} />
        <Dato nombre="Cobraste" valor={plata(neta.cobrado)} />
        <Dato nombre="Ganancia neta" valor={plata(neta.neta)} nota="cobrado − filamento, como tu planilla" tono={neta.neta < 0 ? 'pierde' : undefined} />
        <Dato nombre="Ganancia real" valor={plata(r.ganancia)} nota="restando luz, desgaste y gastos" tono={r.ganancia < 0 ? 'pierde' : 'gana'} />
      </div>

      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-2">
        <section aria-labelledby="t-reparto" className="tarjeta flex flex-col gap-5 p-5">
          <h2 id="t-reparto" className="rotulo">
            ¿A dónde va cada peso que vendés?
          </h2>
          {r.bruto > 0 ? (
            <>
              <div className="flex items-center gap-5">
                <Anillo valor={Math.max(0, r.margen)} tamano={120} grosor={12} etiqueta={`Margen ${pct(r.margen)}`} tono={r.ganancia < 0 ? 'pierde' : 'gana'}>
                  <span className="text-2xl font-bold">{pct(r.margen)}</span>
                  <span className="text-[11px] text-tenue">margen</span>
                </Anillo>
                <p className="text-sm leading-relaxed text-tenue">
                  De cada $100 que vendiste, te quedaron <strong className="text-tinta">{plata(Math.max(0, r.margen) * 100)}</strong> de ganancia. El resto pagó el
                  filamento, la luz, el desgaste de las máquinas y los gastos.
                </p>
              </div>
              <Reparto
                etiqueta="Reparto de lo vendido en el mes"
                partes={[
                  { nombre: 'Ganancia', valor: Math.max(0, r.ganancia), color: 'bg-gana' },
                  { nombre: 'Filamento', valor: r.material, color: 'bg-serie-1' },
                  { nombre: 'Luz', valor: r.luz, color: 'bg-serie-2' },
                  { nombre: 'Desgaste de las máquinas', valor: r.desgaste, color: 'bg-serie-3' },
                  { nombre: 'Envíos, sin venta y otros', valor: otros, color: 'bg-serie-4' },
                ]}
              />
            </>
          ) : (
            <p className="text-sm text-tenue">No hay ventas entregadas en {nombreMes(mes)}.</p>
          )}
        </section>

        <section aria-labelledby="t-resultado" className="tarjeta p-5 lg:overflow-y-auto">
          <h2 id="t-resultado" className="rotulo mb-2">
            Resultado del mes
          </h2>
          <Renglon concepto="Ventas (bruto)" monto={r.bruto} />
          <Renglon concepto="Envíos, descuentos y comisiones" monto={-r.gastosVenta} />
          <Renglon concepto="Filamento usado" monto={-r.material} nota={`${gramos(r.gramos)} impresos`} />
          <Renglon concepto="Luz" monto={-r.luz} />
          <Renglon concepto="Desgaste de las máquinas" monto={-r.desgaste} />
          <Renglon concepto="Impresiones sin venta" monto={-r.impresionesSinVenta} nota="Para vos, regalos, pruebas y fallidas" />
          <Renglon concepto="Otros gastos" monto={-r.otros} nota="Insumos y repuestos comprados en el mes" />
          <Renglon fuerte concepto="Ganancia" monto={r.ganancia} />
          <Explica>
            <p>
              Esto es el <strong>estado de resultados</strong>: lo que vendiste en el mes menos lo que te costó producirlo. Responde “¿este mes gané o perdí?”.
            </p>
            <p>
              No es lo mismo que la caja: si te deben una venta, la ganancia ya cuenta pero la plata todavía no entró. Y si comprás 10 rollos, la caja baja mucho,
              pero el resultado solo cuenta los gramos que usaste.
            </p>
            <p>
              La <strong>ganancia neta</strong> de tu planilla solo resta el filamento; la <strong>ganancia real</strong> también resta la luz y el desgaste de cada
              impresora.
            </p>
          </Explica>
        </section>
      </div>
    </Pagina>
  );
}
