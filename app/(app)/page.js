import Link from 'next/link';
import Enlace from '@/components/enlace';
import Recuperacion from '@/components/recuperacion';
import { cargar } from '@/lib/datos';
import { resultado } from '@/lib/calculos';
import { plata, pct, num, gramos, hoy, nombreMes, moverMes } from '@/lib/formato';
import { Pagina, Seccion, Hoja, Cifra, Explica, Renglon, Vacio, tonoDe } from '@/components/ui';

export const dynamic = 'force-dynamic';

// Los primeros cinco de algo, con una barra proporcional al monto.
function Ranking({ filas, vacio }) {
  if (!filas.length) return <Vacio>{vacio}</Vacio>;
  const mayor = filas[0][2] || 1;
  return (
    <Hoja>
      <ol className="space-y-3">
        {filas.map(([nombre, nota, monto]) => (
          <li key={nombre}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">
                {nombre} <span className="font-normal text-tenue">· {nota}</span>
              </span>
              <span className="shrink-0">{plata(monto)}</span>
            </div>
            <div className="mt-1 h-2 bg-linea">
              <div className="h-2 bg-acento" style={{ width: `${(monto / mayor) * 100}%` }} />
            </div>
          </li>
        ))}
      </ol>
    </Hoja>
  );
}

export default async function Panel({ searchParams }) {
  const d = await cargar();
  const mes = /^\d{4}-\d{2}$/.test(searchParams?.mes ?? '') ? searchParams.mes : hoy().slice(0, 7);
  const r = resultado(d, `${mes}-01`, `${mes}-31`);
  const total = resultado(d);
  const { bolsillo: bol, balance: b, reinversion: re } = d;

  return (
    <Pagina titulo="Panel">
      {d.ajustes.precioKwh === 0 && (
        <p className="border-l-4 border-acento bg-hoja p-4 text-sm">
          Falta el precio del kWh: sin él la luz no se suma al costo de las impresiones.{' '}
          <Link href="/ajustes" className="font-semibold underline">
            Cargalo en Ajustes
          </Link>
          .
        </p>
      )}

      <Recuperacion rec={d.recuperacion} />

      <div className="grid grid-cols-2 gap-px border border-linea bg-linea md:grid-cols-3">
        {[
          ['Caja hoy', plata(b.caja), 'Plata del emprendimiento', tonoDe(b.caja < 0 ? -1 : 0)],
          ['Te deben', plata(b.porCobrar), 'Ventas entregadas sin cobrar del todo', undefined, '/ventas'],
          ['Debés', plata(b.deudas), b.senas ? `Cuotas ${plata(b.cuotas)} · señas ${plata(b.senas)}` : 'Cuotas que faltan pagar', b.deudas ? 'pierde' : undefined],
          ['Encargos', String(d.encargos.length), d.encargos.length ? `${plata(d.encargos.reduce((s, v) => s + v.total, 0))} por entregar` : 'Nada pendiente', undefined, '/ventas'],
          ['Para reinvertir', plata(re.disponible), `${pct(re.pct / 100)} de lo cobrado, menos lo ya comprado con la caja`],
          ['Filamento', plata(b.valorStock), `${gramos(d.stock.reduce((s, l) => s + l.quedan, 0))} en stock`, undefined, '/compras'],
        ].map(([nombre, valor, nota, tono, href]) => (
          <div key={nombre} className="bg-hoja p-4">
            <Cifra nombre={nombre} valor={href ? <Link href={href} className="hover:underline">{valor}</Link> : valor} nota={nota} tono={tono} />
          </div>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <Seccion
          titulo={`Resultado de ${nombreMes(mes)}`}
          accion={
            <div className="flex gap-1">
              <Enlace className="boton-suave" href={`/?mes=${moverMes(mes, -1)}`} aria-label="Mes anterior">
                ←
              </Enlace>
              <Enlace className="boton-suave" href={`/?mes=${moverMes(mes, 1)}`} aria-label="Mes siguiente">
                →
              </Enlace>
            </div>
          }
        >
          <Hoja>
            <Renglon concepto="Ventas (bruto)" monto={r.bruto} nota={`${r.cantidad} ventas · ${r.unidades} unidades`} />
            <Renglon concepto="Envíos, descuentos y comisiones" monto={-r.gastosVenta} />
            <Renglon concepto="Venta neta" monto={r.neto} />
            <Renglon concepto="Filamento usado" monto={-r.material} />
            <Renglon concepto="Luz" monto={-r.luz} />
            <Renglon concepto="Desgaste de las máquinas" monto={-r.desgaste} />
            <Renglon concepto="Impresiones sin venta" monto={-r.impresionesSinVenta} nota="Para vos, regalos, pruebas y fallidas" />
            <Renglon concepto="Otros gastos" monto={-r.otros} nota="Insumos y repuestos comprados en el mes" />
            <Renglon fuerte concepto="Ganancia" monto={r.ganancia} />
            <p className="mt-3 text-sm text-tenue">
              Margen: {pct(r.margen)} de cada venta queda como ganancia · {gramos(r.gramos)} de filamento impresos.
            </p>
            <Explica>
              <p>
                Esto es el <strong>estado de resultados</strong>: lo que vendiste en el mes menos lo que te costó producirlo. Responde “¿este mes
                gané o perdí?”.
              </p>
              <p>
                No es lo mismo que la caja: si te deben una venta, la ganancia ya cuenta pero la plata todavía no entró. Y si comprás 10 rollos, la
                caja baja mucho, pero el resultado solo cuenta los gramos que usaste.
              </p>
              <p>
                El <strong>desgaste</strong> reparte el precio de cada máquina entre las horas que va a durar: cada hora de impresión “paga” una
                parte de la impresora.
              </p>
            </Explica>
          </Hoja>
          <p className="mt-3 text-sm text-tenue">
            Desde el principio: vendiste {plata(total.bruto)} y ganaste {plata(total.ganancia)} ({pct(total.margen)}).
          </p>
        </Seccion>

        <Seccion titulo="Balance de hoy">
          <Hoja>
            <p className="text-sm font-semibold uppercase tracking-wide text-tenue">Lo que tenés</p>
            <Renglon concepto="Caja" monto={b.caja} />
            <Renglon concepto="Lo que te deben" monto={b.porCobrar} />
            <Renglon concepto="Filamento en stock" monto={b.valorStock} />
            {b.valorPiezas > 0 && <Renglon concepto="Piezas hechas sin vender" monto={b.valorPiezas} nota="Stock y encargos sin entregar, a lo que costaron" />}
            <Renglon concepto="Máquinas (valor que les queda)" monto={b.valorMaquinas} />
            {b.otrosEquipos > 0 && <Renglon concepto="Equipos sin asignar a una máquina" monto={b.otrosEquipos} nota="Asocialos en Compras" />}
            <Renglon fuerte concepto="Total" monto={b.activos} />
            <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-tenue">Lo que debés</p>
            <Renglon concepto="Cuotas pendientes" monto={b.cuotas} />
            {b.senas > 0 && <Renglon concepto="Señas de encargos" monto={b.senas} nota="Ya cobradas, falta entregar el trabajo" />}
            <Renglon fuerte concepto="Es tuyo (patrimonio)" monto={b.patrimonio} />
            <p className="mt-3 text-sm">
              Pusiste {plata(bol.aportado - bol.retirado)} de tu bolsillo (neto de retiros), así que el emprendimiento{' '}
              {b.ganado >= 0 ? (
                <>
                  te hizo ganar <strong className="text-gana">{plata(b.ganado)}</strong>.
                </>
              ) : (
                <>
                  todavía está <strong className="text-pierde">{plata(-b.ganado)}</strong> abajo.
                </>
              )}
            </p>
            <Explica>
              <p>
                El <strong>balance</strong> es una foto de un día: todo lo que tenés (plata, lo que te deben, filamento, máquinas) menos lo que
                debés. Lo que queda es lo que de verdad es tuyo.
              </p>
              <p>
                Si a eso le restás lo que pusiste de tu bolsillo, ves cuánto ganaste en total. Las máquinas valen menos con cada hora de uso, por
                eso cuentan “el valor que les queda”.
              </p>
            </Explica>
          </Hoja>
        </Seccion>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <Seccion titulo="Lo que más vendés" accion={<Link href="/productos" className="boton-suave">Ver productos</Link>}>
          <Ranking
            filas={d.productos.filter((p) => p.facturado > 0).slice(0, 5).map((p) => [p.nombre, `${num(p.unidades)} u.`, p.facturado])}
            vacio="Agregá productos para ver cuáles se venden más."
          />
        </Seccion>
        <Seccion titulo="Los que más te compran" accion={<Link href="/clientes" className="boton-suave">Ver clientes</Link>}>
          <Ranking
            filas={d.clientes.filter((c) => c.comprado > 0).slice(0, 5).map((c) => [c.nombre, `${c.pedidos} pedido${c.pedidos === 1 ? '' : 's'}`, c.comprado])}
            vacio="Todavía no hay ventas con cliente."
          />
        </Seccion>
      </div>

    </Pagina>
  );
}
