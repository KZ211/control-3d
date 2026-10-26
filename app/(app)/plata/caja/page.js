import { cargar } from '@/lib/datos';
import { plata, fecha } from '@/lib/formato';
import { Pagina, Vacio, Explica, Dato, Tabla } from '@/components/ui';
import { ContarCaja } from '@/components/punto-de-partida';

export const dynamic = 'force-dynamic';

export default async function Caja() {
  const d = await cargar();
  const movs = [...d.caja].reverse();
  const entro = d.caja.filter((m) => m.monto > 0).reduce((s, m) => s + m.monto, 0);
  const salio = d.caja.filter((m) => m.monto < 0).reduce((s, m) => s - m.monto, 0);

  return (
    <Pagina className="flex h-full flex-col">
      <div className="grid shrink-0 grid-cols-2 sm:grid-cols-3 gap-3">
        <Dato className="col-span-2 sm:col-span-1" nombre="Hay en la caja" valor={plata(d.balance.caja)} tono={d.balance.caja < 0 ? 'pierde' : undefined} />
        <Dato nombre="Entró" valor={plata(entro)} nota="cobros y aportes" tono="gana" />
        <Dato nombre="Salió" valor={plata(salio)} nota="compras, cuotas y retiros" />
      </div>
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_22rem]">
        {movs.length === 0 ? (
          <Vacio>Todavía no hay movimientos. Aparecen al cobrar ventas, pagar con la caja o registrar aportes y retiros.</Vacio>
        ) : (
          <Tabla className="h-full">
            <thead>
              <tr>
                <th className="hidden sm:table-cell">Fecha</th>
                <th>Movimiento</th>
                <th className="num sm:hidden">Monto</th>
                <th className="num hidden sm:table-cell">Entró</th>
                <th className="num hidden sm:table-cell">Salió</th>
                <th className="num">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {movs.map((m, i) => (
                <tr key={i}>
                  <td className="hidden whitespace-nowrap text-tenue sm:table-cell">{fecha(m.fecha)}</td>
                  <td>
                    {m.concepto}
                    <span className="block text-xs text-tenue">
                      <span className="sm:hidden">{fecha(m.fecha)}</span>
                      {m.nota && <span className="sm:before:content-none before:content-['_·_']">{m.nota}</span>}
                    </span>
                  </td>
                  <td className={`num sm:hidden ${m.monto > 0 ? 'text-gana' : 'text-pierde'}`}>
                    {m.monto > 0 ? '+' : '−'}
                    {plata(Math.abs(m.monto))}
                  </td>
                  <td className="num hidden text-gana sm:table-cell">{m.monto > 0 ? plata(m.monto) : ''}</td>
                  <td className="num hidden text-pierde sm:table-cell">{m.monto < 0 ? plata(-m.monto) : ''}</td>
                  <td className="num font-medium">{plata(m.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        )}
        <aside className="tarjeta p-4 lg:overflow-y-auto">
          <h2 className="rotulo mb-3">Contar la caja</h2>
          <ContarCaja calculado={d.balance.caja} hayPunto={Boolean(d.ajustes.puntoPartida)} />
          {d.conteos[0] && (
            <p className="mt-3 text-xs text-tenue">
              Último conteo: {plata(d.conteos[0].contado)} el {fecha(d.conteos[0].fecha)}
              {d.ajustes.puntoPartida && <> · repartís las ventas desde el {fecha(d.ajustes.puntoPartida)}</>}.
            </p>
          )}
          <h2 className="rotulo mt-6">¿Qué es hacer caja?</h2>
          <div className="mt-2 space-y-2 text-sm leading-relaxed text-tenue">
            <p>
              La <strong className="text-tinta">caja</strong> es la plata real del emprendimiento: lo que cobraste menos lo que pagaste con esa plata. “Hacer caja” es
              contar la plata que tenés (efectivo + cuenta) y compararla con este número.
            </p>
            <p>
              Si no coinciden, falta registrar algo: un gasto, una compra o plata que sacaste para vos (eso es un retiro, en Tu bolsillo). Conviene hacerlo una vez por
              semana.
            </p>
            <p>Lo que pagaste de tu bolsillo no aparece acá: no salió de la caja.</p>
            {d.balance.caja < 0 && (
              <p className="font-medium text-pierde">
                La caja está en negativo: registraste más salidas que entradas. Seguramente algo se pagó de tu bolsillo y está cargado como “caja”.
              </p>
            )}
          </div>
        </aside>
      </div>
    </Pagina>
  );
}
