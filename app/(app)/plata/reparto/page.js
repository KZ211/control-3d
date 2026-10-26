import Enlace from '@/components/enlace';
import Icono from '@/components/iconos';
import { cargar } from '@/lib/datos';
import { plata, pct, fecha, gramos } from '@/lib/formato';
import { Pagina, Explica, Renglon } from '@/components/ui';
import { Anillo, Reparto as Barra } from '@/components/graficos';

export const dynamic = 'force-dynamic';

// Lo que tiene que quedar en la caja para que el emprendimiento se sostenga solo
// (reponer el filamento usado, la próxima cuota y el desgaste) y lo que sobra,
// que se puede sacar. Se cuenta desde el punto de partida.
export default async function Reparto() {
  const d = await cargar();
  const p = d.plan;
  const facturado = d.entregadas.reduce((s, v) => s + v.total, 0);
  const cobrado = d.ventas.reduce((s, v) => s + v.cobrado, 0);
  const primera = d.ventas.map((v) => v.fecha).sort()[0];
  const contaste = d.conteos.length > 0;
  const inventario = d.compras.some((c) => c.forma_pago === 'inicial');
  const pc = p.porcentajes;

  const historia = (
    <section aria-labelledby="t-facturado" className="tarjeta p-5 lg:overflow-y-auto">
      <h2 id="t-facturado" className="rotulo mb-2">
        Lo que facturaste
      </h2>
      <p className="text-3xl font-bold tracking-tight">{plata(facturado)}</p>
      <p className="text-sm text-tenue">
        en {d.entregadas.length} ventas entregadas{primera ? ` desde el ${fecha(primera)}` : ''}
      </p>
      <div className="mt-4">
        <Renglon concepto="Cobrado (con señas de encargos)" monto={cobrado} />
        <Renglon concepto="Te deben" monto={d.balance.porCobrar} />
        {p.desde && (
          <>
            <Renglon concepto={`Vendido desde el ${fecha(p.desde)}`} monto={p.vendido} nota={`${p.ventas} ventas · ${gramos(p.gramos)} de filamento`} />
            <Renglon concepto="Sacaste para vos desde ese día" monto={p.sacaste} nota="Retiros, sin contar la diferencia del conteo" />
          </>
        )}
      </div>
    </section>
  );

  const porcentajes = (
    <section aria-labelledby="t-cada" className="tarjeta p-5 lg:overflow-y-auto">
      <h2 id="t-cada" className="rotulo mb-2">
        De cada {plata(1000)} que vendés
      </h2>
      {pc ? (
        <>
          <Barra
            etiqueta="Qué parte de cada venta va a cada cosa"
            partes={[
              { nombre: 'Reponer el filamento', valor: 1000 * pc.reponer, color: 'bg-serie-1' },
              { nombre: 'Cuotas', valor: 1000 * pc.cuotas, color: 'bg-serie-2' },
              { nombre: 'Desgaste de las máquinas', valor: 1000 * pc.desgaste, color: 'bg-serie-3' },
              { nombre: 'Podés sacar', valor: 1000 * Math.max(0, pc.libre), color: 'bg-gana' },
            ]}
          />
          <p className="mt-3 text-sm text-tenue">
            Con lo que vendiste en los últimos tres meses ({plata(pc.vendidoPorMes)} por mes) y el filamento a {plata(p.precioGramo * 1000)} el kilo.
          </p>
          {pc.libre < 0 && (
            <p className="mt-3 rounded-box bg-warning/15 p-3 text-sm">
              Hoy lo que vendés no alcanza para cubrir todo: faltan {plata(-1000 * pc.libre)} de cada {plata(1000)}. Lo que más pesa son las cuotas; cuando se terminen,
              la cuenta cambia.
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-tenue">Cuando tengas ventas de los últimos tres meses, acá vas a ver qué parte de cada una va a cada cosa.</p>
      )}
    </section>
  );

  if (!p.desde) {
    return (
      <Pagina className="lg:flex lg:h-full lg:flex-col">
        <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-3">
          <section aria-labelledby="t-arranque" className="tarjeta p-5 lg:overflow-y-auto">
            <h2 id="t-arranque" className="text-lg font-bold">
              Tu punto de partida
            </h2>
            <p className="mt-1 text-sm text-tenue">
              El historial queda como está. Desde el día que cuentes la caja, cada venta se reparte entre lo que tiene que quedar en la caja y lo que podés sacar.
            </p>
            <ol className="mt-4 space-y-3">
              {[
                [contaste, 'Contá la plata que tenés hoy', 'La diferencia con la app queda como un retiro tuyo.', '/plata/caja'],
                [inventario, 'Cargá el filamento que tenés', 'Por rollo y a precio de hoy: es lo que cuesta reponerlo.', '/compras/filamento'],
              ].map(([hecho, titulo, nota, href], i) => (
                <li key={href}>
                  <Enlace href={href} className="flex min-h-11 items-start gap-3 rounded-box border border-linea p-3 hover:bg-papel">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${hecho ? 'bg-gana text-papel' : 'bg-papel'}`}>
                      {hecho ? <Icono nombre="listo" className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    <span>
                      <span className="block font-medium">{titulo}</span>
                      <span className="block text-xs text-tenue">{nota}</span>
                    </span>
                  </Enlace>
                </li>
              ))}
            </ol>
          </section>
          {porcentajes}
          {historia}
        </div>
      </Pagina>
    );
  }

  const cubierto = p.necesario ? Math.min(1, p.caja / p.necesario) : 1;
  return (
    <Pagina className="lg:flex lg:h-full lg:flex-col">
      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-3">
        <section aria-labelledby="t-hoy" className="tarjeta flex flex-col items-center justify-center gap-4 p-5 text-center lg:overflow-y-auto">
          <h2 id="t-hoy" className="rotulo">
            {p.falta > 0 ? 'Te falta reponer en la caja' : 'Podés sacar'}
          </h2>
          <p className={`text-4xl font-bold tracking-tight ${p.falta > 0 ? 'text-pierde' : 'text-gana'}`}>{plata(p.falta > 0 ? p.falta : p.libre)}</p>
          <Anillo
            valor={cubierto}
            tamano={170}
            grosor={16}
            etiqueta={`La caja cubre el ${pct(cubierto)} de lo que tiene que quedar`}
            tono={p.falta > 0 ? 'acento' : 'gana'}
          >
            <span className="text-4xl font-bold">{pct(cubierto)}</span>
            <span className="text-xs text-tenue">cubierto</span>
          </Anillo>
          <p className="max-w-xs text-sm text-tenue">
            Hay {plata(p.caja)} en la caja y tienen que quedar {plata(p.necesario)} para reponer el filamento, pagar la próxima cuota y cubrir el desgaste.
          </p>
          {p.falta > 0 && p.porCobrar > 0 && (
            <p className="rounded-box bg-papel px-3 py-2 text-xs text-tenue">
              Te deben {plata(p.porCobrar)}: {p.porCobrar >= p.falta ? 'cuando cobres, queda cubierto.' : `cuando cobres, faltarán ${plata(p.falta - p.porCobrar)}.`}
            </p>
          )}
        </section>

        <section aria-labelledby="t-queda" className="tarjeta p-5 lg:overflow-y-auto">
          <h2 id="t-queda" className="rotulo mb-2">
            Lo que tiene que quedar en la caja
          </h2>
          <Renglon
            concepto="Reponer el filamento"
            monto={p.reponer}
            nota={`${gramos(p.gramos)} usados desde el ${fecha(p.desde)} a ${plata(p.precioGramo * 1000)} el kilo${p.repuesto ? `, menos ${plata(p.repuesto)} que ya compraste con la caja` : ''}`}
          />
          <Renglon
            concepto="Próxima cuota"
            monto={p.proximaCuota}
            nota={p.cuotasRestantes ? `En total faltan ${plata(p.cuotasRestantes)}` : 'No tenés cuotas por pagar'}
          />
          <Renglon
            concepto="Desgaste de las máquinas"
            monto={p.fondoDesgaste}
            nota={
              p.desgasteGramo
                ? `Para arreglos o una máquina nueva${p.arreglos ? `, menos ${plata(p.arreglos)} ya gastados` : ''}`
                : 'Se calcula cuando cargás impresiones con su máquina'
            }
          />
          <Renglon fuerte concepto="Tiene que quedar" monto={p.necesario} />
          <Renglon
            concepto="Hay en la caja"
            monto={p.caja}
            nota={d.conteos[0] ? `Contada el ${fecha(d.conteos[0].fecha)}, más lo que entró y salió después` : undefined}
          />
          <Renglon fuerte concepto={p.falta > 0 ? 'Falta reponer' : 'Podés sacar'} monto={p.falta > 0 ? -p.falta : p.libre} />
          <Explica titulo="¿Por qué reponer a precio de hoy?">
            <p>
              Para seguir teniendo la misma cantidad de filamento, cada gramo que usás lo tenés que volver a comprar al precio de hoy, no al que lo pagaste. Por eso el
              inventario se carga con el precio actual de cada rollo, y cuando comprás filamento con la caja, eso ya cuenta como repuesto.
            </p>
            <p>
              Lo que sobra después de reponer, pagar la cuota y guardar para el desgaste es lo que el emprendimiento te puede dar sin achicarse. Si lo sacás, registralo
              en Tu bolsillo como retiro.
            </p>
          </Explica>
        </section>

        <div className="grid gap-4 lg:min-h-0 lg:auto-rows-min lg:overflow-y-auto">
          {porcentajes}
          {historia}
        </div>
      </div>
    </Pagina>
  );
}
