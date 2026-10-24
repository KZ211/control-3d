import Link from 'next/link';
import { cargar } from '@/lib/datos';
import { resultado, gananciaNeta } from '@/lib/calculos';
import { plata, pct, hoy, moverMes, nombreMes } from '@/lib/formato';
import { Pagina, Hoja } from '@/components/ui';

export const dynamic = 'force-dynamic';

function Tema({ id, titulo, children }) {
  return (
    <Hoja>
      <h2 id={id} className="scroll-mt-28 text-xl font-semibold tracking-tight">
        {titulo}
      </h2>
      <div className="mt-3 max-w-3xl space-y-3 leading-relaxed">{children}</div>
    </Hoja>
  );
}

function Ejemplo({ children }) {
  return <div className="border-l-4 border-acento bg-papel p-4 text-sm">{children}</div>;
}

const TEMAS = [
  ['bruto-neto', 'Bruto, neto y ganancia'],
  ['costo', 'El costo de una impresión'],
  ['precio', 'Cómo poner precio'],
  ['reinversion', 'Reinvertir'],
  ['caja', 'La caja'],
  ['resultado', 'El resultado'],
  ['balance', 'El balance'],
  ['capital', 'Capital y deuda'],
  ['recuperar', '¿Cuándo recupero todo?'],
  ['rutina', 'Una rutina simple'],
];

export default async function Aprender() {
  const d = await cargar();
  const total = resultado(d);
  const rec = d.recuperacion;
  const bol = d.bolsillo;
  const b = d.balance;
  const mejor = d.productos.find((p) => p.unidades > 0);

  // Ganancia neta promedio de los últimos 3 meses cerrados, para estimar.
  const mesActual = hoy().slice(0, 7);
  const meses = [1, 2, 3].map((k) => moverMes(mesActual, -k));
  const porMes = meses.map((m) => gananciaNeta(d, `${m}-01`, `${m}-31`).neta);
  const promedio = porMes.reduce((s, g) => s + g, 0) / porMes.length;
  const mesesParaRecuperar = promedio > 0 && rec.falta > 0 ? Math.ceil(rec.falta / promedio) : null;

  return (
    <Pagina titulo="Aprender" bajada="Los conceptos básicos para llevar las cuentas de un emprendimiento, con tus propios números.">
      <nav aria-label="Temas" className="flex flex-wrap gap-2">
        {TEMAS.map(([id, nombre]) => (
          <a key={id} href={`#${id}`} className="boton-suave">
            {nombre}
          </a>
        ))}
      </nav>

      <Tema id="bruto-neto" titulo="Bruto, neto y ganancia">
        <p>
          <strong>Venta bruta</strong> es todo lo que te paga el cliente. <strong>Venta neta</strong> es lo que queda después de lo que se va en la
          venta misma: envío, descuentos, comisiones. <strong>Ganancia</strong> es la neta menos lo que te costó fabricar lo que vendiste.
        </p>
        <Ejemplo>
          Hasta hoy vendiste <strong>{plata(total.bruto)}</strong> bruto. Después de envíos y costos de producción, la ganancia fue{' '}
          <strong>{plata(total.ganancia)}</strong>: de cada $100 que cobraste te quedaron {plata(total.margen * 100)}. Eso es el{' '}
          <strong>margen</strong> ({pct(total.margen)}).
        </Ejemplo>
        <p>
          En tu planilla, “Total neto” es el 66% de lo vendido: el 34% restante es lo que apartás para reinvertir. Es una regla útil, pero no es la
          ganancia: la ganancia sale de restar lo que costó de verdad cada pieza.
        </p>
        <p>
          Margen y ganancia sobre el costo no son lo mismo. Si algo te cuesta $1.000 y lo vendés a $2.000, ganás 100% <em>sobre el costo</em>, pero
          tu margen es 50% <em>de la venta</em>.
        </p>
      </Tema>

      <Tema id="costo" titulo="El costo de una impresión">
        <p>Una pieza cuesta mucho más que el filamento que usa. La app suma tres cosas:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Filamento:</strong> gramos × precio por gramo del rollo. Un rollo de 1 kg a $18.000 cuesta $18 el gramo.
          </li>
          <li>
            <strong>Luz:</strong> una impresora de 150 W durante 4 horas gasta 0,6 kWh; multiplicalo por el precio del kWh de tu factura.
          </li>
          <li>
            <strong>Desgaste (amortización):</strong> si la A1 costó $640.000 y esperás que dure 5.000 horas, cada hora de uso “gasta” $128 de la
            máquina. Cuando la impresora ya no dé más, esas horas cobradas son las que pagan la siguiente.
          </li>
        </ul>
        <p>
          Lo que no suma es tu tiempo ni las piezas que salen mal. Por eso el precio tiene que estar bastante por encima del costo (lo ajustás en{' '}
          <Link href="/ajustes" className="underline">
            Ajustes
          </Link>
          ).
        </p>
      </Tema>

      <Tema id="precio" titulo="Cómo poner precio">
        <p>
          Tu planilla multiplica el costo del filamento: primero ×3, después ×4 y ahora ×5. Es un método simple y muy usado. Lo importante es saber
          qué tiene que pagar ese multiplicador además del material: la luz, el desgaste de la máquina, las piezas fallidas, tu tiempo y la ganancia.
        </p>
        <Ejemplo>
          Hoy usás ×{d.ajustes.multiplicador} con {plata(d.ajustes.costoGramo)} el gramo. Un portafiguritas de 75 g cuesta{' '}
          {plata(75 * d.ajustes.costoGramo)} de filamento: el sugerido es {plata(75 * d.ajustes.costoGramo * d.ajustes.multiplicador)}.
          {mejor && (
            <>
              {' '}
              Tu producto que más facturó es <strong>{mejor.nombre}</strong>: vendiste {mejor.unidades} a {plata(mejor.precioPromedio)} en promedio.
            </>
          )}
        </Ejemplo>
        <p>
          Cuando vendés muchas unidades del mismo diseño, cada una extra cuesta solo el material y la máquina: ahí podés hacer precio por cantidad.
          Las piezas únicas o grandes llevan más trabajo y riesgo de que salgan mal, y conviene cobrarlas más.
        </p>
      </Tema>

      <Tema id="reinversion" titulo="Reinvertir">
        <p>
          <strong>Reinvertir</strong> es usar parte de lo que ganás para que el emprendimiento siga andando o crezca: filamento, repuestos, otra
          máquina. Apartar un porcentaje fijo de cada venta (vos usás {pct(d.reinversion.pct / 100)}) evita gastarse todo y quedarse sin material.
        </p>
        <Ejemplo>
          De lo cobrado, {pct(d.reinversion.pct / 100)} son <strong>{plata(d.reinversion.apartar)}</strong>. Con la caja ya compraste{' '}
          {plata(d.reinversion.reinvertido)}, así que te quedan <strong>{plata(d.reinversion.disponible)}</strong> para reinvertir.{' '}
          <Link href="/tu-plata" className="underline">
            Ver detalle
          </Link>
          .
        </Ejemplo>
      </Tema>

      <Tema id="caja" titulo="La caja (o “hacer caja”)">
        <p>
          La <strong>caja</strong> es la plata que realmente tiene el emprendimiento, en efectivo o en la cuenta. Sube cuando cobrás y baja cuando
          pagás algo con esa plata.
        </p>
        <p>
          <strong>Hacer caja</strong> es contar la plata que tenés de verdad y comparar con lo que dice la app. Si no da igual, te olvidaste de
          registrar algo: un gasto, una compra o plata que usaste para vos.
        </p>
        <Ejemplo>
          Según lo registrado, hoy hay <strong>{plata(b.caja)}</strong> en la caja.{' '}
          <Link href="/caja" className="underline">
            Ver movimientos
          </Link>
          .
        </Ejemplo>
      </Tema>

      <Tema id="resultado" titulo="El resultado (¿gané o perdí este mes?)">
        <p>
          El <strong>estado de resultados</strong> responde “¿este mes gané o perdí?”. Suma lo que vendiste y le resta lo que costó producirlo y los
          gastos del mes.
        </p>
        <p>
          Ganar no es lo mismo que tener plata. Podés ganar y tener la caja vacía (te deben, o compraste 10 rollos), o tener la caja llena y estar
          perdiendo (cobraste una seña de algo que todavía no hiciste). Por eso se miran las dos cosas.
        </p>
      </Tema>

      <Tema id="balance" titulo="El balance (¿cuánto vale lo que tengo?)">
        <p>
          El <strong>balance</strong> es una foto de un día. De un lado, todo lo que tenés (los <strong>activos</strong>): caja, lo que te deben,
          filamento sin usar, piezas hechas y máquinas. Del otro, lo que debés (los <strong>pasivos</strong>): las cuotas y las señas de encargos que
          todavía no entregaste. La diferencia es el{' '}
          <strong>patrimonio</strong>, lo que de verdad es tuyo.
        </p>
        <Ejemplo>
          Hoy tenés {plata(b.activos)} y debés {plata(b.deudas)}: tu patrimonio es <strong>{plata(b.patrimonio)}</strong>. Pusiste{' '}
          {plata(bol.aportado - bol.retirado)} de tu bolsillo (neto de retiros), así que {b.ganado >= 0 ? 'ganaste' : 'todavía estás abajo'}{' '}
          <strong>{plata(Math.abs(b.ganado))}</strong>.
        </Ejemplo>
        <p>Las máquinas valen menos con cada hora de uso: por eso en el balance cuentan por el valor que les queda, no por lo que pagaste.</p>
      </Tema>

      <Tema id="capital" titulo="Capital y deuda: tu liquidación">
        <p>
          La plata de tu liquidación no es una deuda: no le debés a nadie. Es <strong>capital</strong>, plata tuya invertida que querés que vuelva.
          Una <strong>deuda</strong> (un <strong>pasivo</strong>) es algo que tenés que pagar sí o sí, como las cuotas del AMS.
        </p>
        <p>
          La plata vuelve a tus manos con <strong>retiros</strong>: sacás plata de la caja para vos. No es lo mismo que recuperar la inversión:
          eso pasa cuando la ganancia neta llega a lo que costó el equipo, aunque la plata siga en la caja.
        </p>
        <Ejemplo>
          Pusiste {plata(bol.aportado)} de tu bolsillo. Ya sacaste {plata(bol.retirado)} y hay {plata(bol.caja)} en la caja. Las cuotas que faltan del
          AMS son {plata(b.cuotas)}: esa sí es una deuda.
        </Ejemplo>
      </Tema>

      <Tema id="recuperar" titulo="¿Cuándo recupero todo?">
        <p>
          Una forma simple de estimarlo: lo que falta recuperar del equipo dividido la ganancia neta de un mes normal. Es el{' '}
          <strong>plazo de recupero</strong>.
        </p>
        <Ejemplo>
          Te faltan {plata(Math.max(0, rec.falta))} de {plata(rec.equipos)}. Ganancia neta de los últimos tres meses: {meses.map((m, i) => `${nombreMes(m)} ${plata(porMes[i])}`).join(' · ')}. Promedio:{' '}
          <strong>{plata(promedio)}</strong> por mes.{' '}
          {rec.falta <= 0
            ? 'Ya recuperaste todo el equipo.'
            : mesesParaRecuperar
              ? `A ese ritmo, recuperás los ${plata(rec.falta)} que faltan en unos ${mesesParaRecuperar} meses.`
              : 'Cuando cargues ventas de algunos meses vas a ver la estimación.'}
        </Ejemplo>
        <p>
          Para que se acorte: subir precios, vender más del mismo diseño (cada unidad extra cuesta solo el material) o usar más la máquina que está
          parada.
        </p>
      </Tema>

      <Tema id="rutina" titulo="Una rutina simple">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Cada venta:</strong> cargá la venta con sus piezas. Si querés el costo exacto, cargá también sus impresiones (los gramos y las
            horas salen del laminador). Si es un encargo, marcalo como encargo y registrá la seña.
          </li>
          <li>
            <strong>Cada compra:</strong> cargala diciendo si la pagaste con la caja o con tu plata.
          </li>
          <li>
            <strong>Una vez por semana:</strong> hacé caja. Si sacaste plata para vos, registrala como retiro.
          </li>
          <li>
            <strong>Una vez por mes:</strong> mirá el resultado del mes en el panel y compará con el anterior.
          </li>
        </ul>
      </Tema>
    </Pagina>
  );
}
