import { cargar } from '@/lib/datos';
import { plata } from '@/lib/formato';
import { Pagina, Explica, Renglon } from '@/components/ui';
import { Reparto } from '@/components/graficos';

export const dynamic = 'force-dynamic';

export default async function Balance() {
  const d = await cargar();
  const { balance: b, bolsillo: bol } = d;
  const tenes = [
    { nombre: 'Máquinas (lo que les queda)', valor: b.valorMaquinas },
    { nombre: 'Caja', valor: Math.max(0, b.caja) },
    { nombre: 'Te deben', valor: b.porCobrar },
    { nombre: 'Filamento en stock', valor: b.valorStock },
    { nombre: 'Piezas sin vender y otros equipos', valor: b.valorPiezas + b.otrosEquipos },
  ];
  const pusiste = bol.aportado - bol.retirado;

  return (
    <Pagina className="lg:flex lg:h-full lg:flex-col">
      <section aria-labelledby="t-patrimonio" className="tarjeta grid shrink-0 gap-4 p-5 md:grid-cols-3">
        <div>
          <h2 id="t-patrimonio" className="text-sm text-tenue">
            Es tuyo (patrimonio)
          </h2>
          <p className="text-4xl font-bold tracking-tight">{plata(b.patrimonio)}</p>
          <p className="text-xs text-tenue">
            Tenés {plata(b.activos)} y debés {plata(b.deudas)}
          </p>
        </div>
        <div>
          <p className="text-sm text-tenue">Pusiste de tu bolsillo</p>
          <p className="text-2xl font-bold">{plata(pusiste)}</p>
          <p className="text-xs text-tenue">neto de retiros</p>
        </div>
        <div>
          <p className="text-sm text-tenue">{b.ganado >= 0 ? 'El negocio te hizo ganar' : 'Todavía está abajo'}</p>
          <p className={`text-2xl font-bold ${b.ganado >= 0 ? 'text-gana' : 'text-pierde'}`}>{plata(Math.abs(b.ganado))}</p>
          <p className="text-xs text-tenue">patrimonio − lo que pusiste</p>
        </div>
      </section>

      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-2">
        <section aria-labelledby="t-tenes" className="tarjeta p-5 lg:overflow-y-auto">
          <h2 id="t-tenes" className="rotulo mb-3">
            Lo que tenés · {plata(b.activos)}
          </h2>
          <Reparto partes={tenes} etiqueta="En qué está lo que tenés" />
          {b.otrosEquipos > 0 && <p className="mt-3 text-xs text-tenue">Hay equipos sin asignar a una máquina: asocialos en Compras.</p>}
        </section>

        <section aria-labelledby="t-debes" className="tarjeta p-5 lg:overflow-y-auto">
          <h2 id="t-debes" className="rotulo mb-2">
            Lo que debés · {plata(b.deudas)}
          </h2>
          <Renglon concepto="Cuotas pendientes" monto={b.cuotas} />
          {b.senas > 0 && <Renglon concepto="Señas de encargos" monto={b.senas} nota="Ya cobradas, falta entregar el trabajo" />}
          <Renglon fuerte concepto="Total que debés" monto={b.deudas} />
          <Explica>
            <p>
              El <strong>balance</strong> es una foto de un día: todo lo que tenés (plata, lo que te deben, filamento, máquinas) menos lo que debés. Lo que queda es
              lo que de verdad es tuyo.
            </p>
            <p>
              Si a eso le restás lo que pusiste de tu bolsillo, ves cuánto ganaste en total. Las máquinas valen menos con cada hora de uso, por eso cuentan “lo que
              les queda”.
            </p>
          </Explica>
        </section>
      </div>
    </Pagina>
  );
}
