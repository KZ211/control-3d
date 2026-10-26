import { cargar } from '@/lib/datos';
import { plata, plataFina, fecha, gramos } from '@/lib/formato';
import { Pagina, Vacio, Dato } from '@/components/ui';
import { Accion } from '@/components/formulario';
import { marcarAgotado } from '@/app/acciones';
import { InventarioFilamento } from '@/components/punto-de-partida';
import { CorregirGramos } from '@/components/filamento';

export const dynamic = 'force-dynamic';

export default async function Filamento() {
  const d = await cargar();
  const lotes = d.compras.filter((c) => c.categoria === 'filamento');
  const activos = lotes.filter((c) => !c.agotado);
  const quedan = d.stock.reduce((s, l) => s + l.quedan, 0);
  const sueltos = d.gramosSueltos.ventas + d.gramosSueltos.impresiones;

  return (
    <Pagina className="lg:flex lg:h-full lg:flex-col">
      <div className="grid shrink-0 grid-cols-2 sm:grid-cols-3 gap-3">
        <Dato className="col-span-2 sm:col-span-1" nombre="Te quedan" valor={gramos(quedan)} nota={`${activos.length} rollos con stock`} />
        <Dato nombre="Valen" valor={plata(d.balance.valorStock)} nota="lo que costaron (el inventario, a precio de hoy)" />
        <Dato nombre="Precio por gramo" valor={quedan ? plataFina(d.balance.valorStock / quedan) : '—'} nota="promedio del stock" />
      </div>

      <div className="shrink-0">
        <InventarioFilamento rollosViejos={activos.length} />
      </div>
      {lotes.length === 0 ? (
        <Vacio>Cargá tus rollos en Compras → Nueva para ver cuánto te queda.</Vacio>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:min-h-0 lg:flex-1 lg:auto-rows-min lg:overflow-y-auto xl:grid-cols-3">
          {lotes.map((c) => {
            const total = c.lote.gramos || 1;
            const resto = Math.max(0, c.lote.gramos - c.lote.usados);
            const parte = c.agotado ? 0 : resto / total;
            return (
              <li key={c.id} className={`tarjeta p-4 ${c.agotado ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{[c.material, c.color].filter(Boolean).join(' ') || c.descripcion}</p>
                    <p className="text-xs text-tenue">
                      {fecha(c.fecha)} · {Number(c.cantidad)} × {gramos(c.gramos_por_unidad ?? 1000)} · {plataFina(c.lote.costoGramo)}/g
                    </p>
                  </div>
                  <Accion accion={marcarAgotado.bind(null, c.id, !c.agotado)}>{c.agotado ? 'Tengo' : 'Se terminó'}</Accion>
                </div>
                <div className="mt-3 flex items-baseline justify-between text-sm">
                  <span className="font-semibold">{c.agotado ? 'Agotado' : `Quedan ${gramos(resto)}`}</span>
                  <span className="text-xs text-tenue">{Math.round(parte * 100)}%</span>
                </div>
                <progress
                  className={`progress mt-1 h-2.5 w-full ${parte < 0.15 ? 'progress-error' : parte < 0.35 ? 'progress-warning' : 'progress-success'}`}
                  value={parte * 100}
                  max="100"
                  aria-label={`Queda el ${Math.round(parte * 100)}%`}
                />
                <p className="mt-1 text-xs text-tenue">
                  Usado {gramos(c.lote.usados)}
                  {c.lote.usadosSinLote > 0 && ` (${gramos(c.lote.usadosSinLote)} sin lote)`}
                  {c.lote.ajuste !== 0 && ` · corregido al pesarlo: ${c.lote.ajuste > 0 ? '+' : '−'}${gramos(Math.abs(c.lote.ajuste))}`}
                </p>
                <CorregirGramos
                  id={c.id}
                  nombre={[c.material, c.color].filter(Boolean).join(' ') || c.descripcion}
                  cantidad={Number(c.cantidad)}
                  porRollo={c.gramos_por_unidad ?? 1000}
                  quedan={resto}
                />
              </li>
            );
          })}
        </ul>
      )}

      {sueltos > 0 && (
        <p className="shrink-0 rounded-box border border-acento/40 bg-acento/10 p-3 text-xs">
          {gramos(sueltos)} impresos no dicen de qué rollo salieron ({gramos(d.gramosSueltos.ventas)} de ventas sin impresiones, como las de la planilla, y{' '}
          {gramos(d.gramosSueltos.impresiones)} de impresiones sin lote). Se descuentan de los rollos más viejos primero.
          {d.gramosSueltos.sinRollo > 0 && ` ${gramos(d.gramosSueltos.sinRollo)} no entran en ningún rollo: falta cargar alguna compra de filamento.`} Si al contar no
          coincide, pesá el rollo y usá “Corregir gramos”, o “Se terminó”.
        </p>
      )}
    </Pagina>
  );
}
