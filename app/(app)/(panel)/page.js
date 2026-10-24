import Link from 'next/link';
import { cargar } from '@/lib/datos';
import { gananciaNeta } from '@/lib/calculos';
import { plata, pct, num, fecha, hoy, moverMes, nombreMes } from '@/lib/formato';
import { Pagina, Dato } from '@/components/ui';
import { Anillo, Columnas, Ranking } from '@/components/graficos';
import { BotonVenta } from '@/components/navegacion';

export const dynamic = 'force-dynamic';

const MES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const delMes = (d, m) => gananciaNeta(d, `${m}-01`, `${m}-31`);
const cambio = (ahora, antes) => (antes > 0 ? ahora / antes - 1 : null);

export default async function Resumen() {
  const d = await cargar();
  const hoyEs = hoy();
  const mes = hoyEs.slice(0, 7);
  const actual = delMes(d, mes);
  const anterior = delMes(d, moverMes(mes, -1));
  const meses = Array.from({ length: 6 }, (_, i) => moverMes(mes, i - 5)).map((m) => {
    const r = delMes(d, m);
    return { etiqueta: MES_CORTO[Number(m.slice(5)) - 1], valor: r.cobrado, parte: Math.max(0, r.neta), actual: m === mes };
  });
  const rec = d.recuperacion;
  const b = d.balance;
  const deben = d.entregadas.filter((v) => v.saldo > 0);
  const productos = d.productos.filter((p) => p.facturado > 0).slice(0, 5);
  const facturado = d.productos.reduce((s, p) => s + p.facturado, 0);

  // Si hace días que no cargás ventas, la app te lo recuerda.
  const ultima = [...d.entregadas, ...d.encargos].reduce((m, v) => (v.fecha > m ? v.fecha : m), '');
  const dias = ultima ? Math.round((new Date(`${hoyEs}T12:00:00`) - new Date(`${ultima}T12:00:00`)) / 864e5) : null;

  return (
    <Pagina className="lg:flex lg:h-full lg:flex-col">
      {(dias === null || dias >= 3) && (
        <div role="status" className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-box border border-acento/40 bg-acento/10 px-4 py-3 text-sm">
          <span>
            {dias === null ? (
              'Todavía no cargaste ninguna venta.'
            ) : (
              <>
                Tu última venta cargada es del <strong>{fecha(ultima)}</strong>, hace {dias} días. ¿Te quedó alguna sin anotar?
              </>
            )}
          </span>
          <BotonVenta className="btn-sm" />
        </div>
      )}
      {d.ajustes.precioKwh === 0 && (
        <p className="shrink-0 text-xs text-tenue">
          Falta el precio del kWh: sin él la luz no se suma al costo de las impresiones.{' '}
          <Link href="/ajustes" className="font-semibold underline">
            Cargalo en Ajustes
          </Link>
          .
        </p>
      )}

      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-3 lg:grid-rows-[auto_minmax(0,1fr)]">
        {/* Recuperación del equipo */}
        <section aria-labelledby="t-rec" className="tarjeta order-2 flex flex-col items-center gap-4 p-5 text-center lg:order-none lg:row-span-2 lg:justify-center">
          <h2 id="t-rec" className="rotulo">
            Recuperación del equipo
          </h2>
          <Anillo valor={rec.avance} tamano={180} grosor={16} etiqueta={`Recuperado ${pct(rec.avance)} del equipo`} tono={rec.falta <= 0 ? 'gana' : 'acento'}>
            <span className="text-4xl font-bold">{pct(rec.avance)}</span>
            <span className="text-xs text-tenue">recuperado</span>
          </Anillo>
          <div>
            {rec.falta > 0 ? (
              <>
                <p className="text-sm text-tenue">Te falta</p>
                <p className="text-3xl font-bold tracking-tight">{plata(rec.falta)}</p>
              </>
            ) : (
              <>
                <p className="text-sm text-tenue">Ya lo recuperaste y vas</p>
                <p className="text-3xl font-bold tracking-tight text-gana">+{plata(-rec.falta)}</p>
              </>
            )}
          </div>
          <dl className="grid w-full grid-cols-2 gap-2 text-sm">
            <div className="rounded-box bg-papel p-2">
              <dt className="text-xs text-tenue">Equipo</dt>
              <dd className="font-semibold">{plata(rec.equipos)}</dd>
            </div>
            <div className="rounded-box bg-papel p-2">
              <dt className="text-xs text-tenue">Ganancia neta</dt>
              <dd className="font-semibold text-gana">{plata(rec.neta)}</dd>
            </div>
          </dl>
          {rec.porCobrar > 0 && rec.falta > 0 && (
            <p className="text-xs text-tenue">Cuando cobres lo que te deben, faltarán {plata(Math.max(0, rec.falta - rec.porCobrar))}.</p>
          )}
          <Link href="/plata" className="boton-suave">
            Ver la cuenta
          </Link>
        </section>

        {/* Números del mes */}
        <div className="order-1 grid grid-cols-2 gap-3 lg:order-none lg:col-span-2 xl:grid-cols-4">
          <Dato nombre={`Cobrado en ${MES_CORTO[Number(mes.slice(5)) - 1]}`} valor={plata(actual.cobrado)} cambio={cambio(actual.cobrado, anterior.cobrado)} nota="vs. mes anterior" />
          <Dato
            nombre="Ganancia neta del mes"
            valor={plata(actual.neta)}
            tono={actual.neta < 0 ? 'pierde' : undefined}
            nota={actual.cobrado ? `${pct(actual.neta / actual.cobrado)} de lo cobrado` : 'sin ventas todavía'}
          />
          <Dato nombre="Caja hoy" valor={plata(b.caja)} tono={b.caja < 0 ? 'pierde' : undefined} nota={<Link href="/plata/caja" className="underline">ver movimientos</Link>} />
          <Dato
            nombre="Te deben"
            valor={plata(b.porCobrar)}
            tono={b.porCobrar ? 'pierde' : undefined}
            nota={
              <Link href="/ventas/cobrar" className="underline">
                {deben.length} venta{deben.length === 1 ? '' : 's'}
                {d.encargos.length ? ` · ${d.encargos.length} encargo${d.encargos.length === 1 ? '' : 's'}` : ''}
              </Link>
            }
          />
        </div>

        {/* Últimos meses */}
        <section aria-labelledby="t-meses" className="tarjeta order-3 flex min-h-72 flex-col p-4 lg:order-none lg:min-h-0">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 id="t-meses" className="rotulo">
              Últimos 6 meses
            </h2>
            <Link href="/panel/mes" className="text-xs font-medium text-primary hover:underline">
              Ver {nombreMes(mes)}
            </Link>
          </div>
          <div className="min-h-0 flex-1">
            <Columnas datos={meses} nombre="Cobrado" nombreParte="Ganancia neta" etiqueta="Cobrado y ganancia neta de los últimos 6 meses" />
          </div>
        </section>

        {/* Lo que más vendés */}
        <section aria-labelledby="t-prod" className="tarjeta order-4 flex min-h-0 flex-col p-4 lg:order-none">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 id="t-prod" className="rotulo">
              Lo que más vendés
            </h2>
            <Link href="/taller/productos" className="text-xs font-medium text-primary hover:underline">
              Productos
            </Link>
          </div>
          {productos.length ? (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <Ranking filas={productos.map((p) => ({ nombre: p.nombre, nota: `${num(p.unidades)} u.`, valor: p.facturado }))} total={facturado} />
            </div>
          ) : (
            <p className="text-sm text-tenue">Cuando vendas productos del catálogo, acá vas a ver cuáles rinden más.</p>
          )}
        </section>
      </div>
    </Pagina>
  );
}
