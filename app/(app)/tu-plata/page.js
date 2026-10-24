import { cargar } from '@/lib/datos';
import { plata, fecha, pct, hoy } from '@/lib/formato';
import { Pagina, Seccion, Hoja, Vacio, Explica, Campo, Renglon } from '@/components/ui';
import Recuperacion from '@/components/recuperacion';
import { Accion, Formulario, Enviar } from '@/components/formulario';
import { borrar, moverCapital } from '../../acciones';

export const dynamic = 'force-dynamic';

export default async function TuPlata() {
  const d = await cargar();
  const bol = d.bolsillo;
  const bolsillo = d.compras.filter((c) => c.forma_pago === 'bolsillo').reduce((s, c) => s + Number(c.total), 0);
  const cuotasBolsillo = d.compras.flatMap((c) => c.pagos).filter((p) => p.pagado_con === 'bolsillo').reduce((s, p) => s + Number(p.monto), 0);
  const aportes = d.capital.filter((m) => m.tipo === 'aporte').reduce((s, m) => s + Number(m.monto), 0);

  return (
    <Pagina titulo="Tu plata" bajada="Cuánto falta para que la ganancia pague el equipo, y la plata que entra y sale de tu bolsillo.">
      <Recuperacion rec={d.recuperacion} detalle />

      <div className="grid gap-4 lg:grid-cols-2">
        <Hoja>
          <h2 className="text-xl font-semibold">Tu bolsillo</h2>
          <div className="mt-4 text-sm">
            <Renglon concepto="Compras pagadas de tu bolsillo" monto={bolsillo} />
            <Renglon concepto="Cuotas pagadas de tu bolsillo" monto={cuotasBolsillo} />
            <Renglon concepto="Aportes a la caja" monto={aportes} />
            <Renglon fuerte concepto="Pusiste" monto={bol.aportado} />
            <Renglon concepto="Ya sacaste (retiros)" monto={bol.retirado} />
            <Renglon concepto="Está en la caja" monto={bol.caja} nota="La podés sacar cuando quieras" />
          </div>
          <Explica titulo="¿Para qué sirve si ya está la recuperación?">
            <p>
              La recuperación de arriba mide si el negocio ya pagó el equipo. Esto es otra cosa: cuánta plata tuya salió y cuánta ya volvió a tus
              manos. Podés haber recuperado el equipo con la ganancia y tener esa plata todavía en la caja, sin haberla sacado.
            </p>
          </Explica>
        </Hoja>

        <Hoja>
          <h2 className="text-xl font-semibold">Registrar un movimiento</h2>
          <Formulario accion={moverCapital} className="mt-4 grid gap-4 sm:grid-cols-2">
            <Campo nombre="Tipo" className="sm:col-span-2">
              <select name="tipo" className="entrada" defaultValue="retiro">
                <option value="retiro">Retiro: saco plata de la caja para mí</option>
                <option value="aporte">Aporte: pongo plata mía en la caja</option>
              </select>
            </Campo>
            <Campo nombre="Monto">
              <input name="monto" inputMode="decimal" required className="entrada" />
            </Campo>
            <Campo nombre="Fecha">
              <input name="fecha" type="date" defaultValue={hoy()} required className="entrada" />
            </Campo>
            <Campo nombre="Nota" className="sm:col-span-2">
              <input name="nota" className="entrada" />
            </Campo>
            <div className="sm:col-span-2">
              <Enviar>Guardar</Enviar>
            </div>
          </Formulario>
          <Explica titulo="¿Aporte o retiro?">
            <p>
              Lo que pusiste de tu liquidación es <strong>capital</strong>: no es una deuda con nadie, es plata tuya invertida que querés que
              vuelva.
            </p>
            <p>
              Vuelve cuando hacés un <strong>retiro</strong>: sacás plata de la caja para vos. Si gastás plata de las ventas en algo personal,
              también es un retiro. Registralo, así la caja coincide con la plata que tenés.
            </p>
            <p>
              Un <strong>aporte</strong> es lo contrario: ponés plata tuya en la caja (por ejemplo, para comprar filamento). Si pagás una compra
              directo de tu bolsillo, no hace falta: marcala como “de mi bolsillo” en Compras.
            </p>
          </Explica>
        </Hoja>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">

        <Hoja>
          <h2 className="text-xl font-semibold">Reinversión</h2>
          <div className="mt-4 text-sm">
            <Renglon concepto={`${pct(d.reinversion.pct / 100)} de lo cobrado`} monto={d.reinversion.apartar} nota="Lo que apartás para filamento" />
            <Renglon concepto="Ya comprado con la caja" monto={-d.reinversion.reinvertido} nota="Compras y cuotas pagadas con plata de las ventas" />
            <Renglon fuerte concepto="Disponible para reinvertir" monto={d.reinversion.disponible} />
          </div>
          {d.propias.cantidad > 0 && (
            <p className="mt-4 text-sm">
              Además, imprimiste {d.propias.cantidad} cosas para vos y la familia: te costaron {plata(d.propias.costo)} y comprarlas valdría{' '}
              {plata(d.propias.valor)}.
            </p>
          )}
          <Explica titulo="¿Qué es reinvertir?">
            <p>
              Tu planilla separa cada venta en dos: un 34% para <strong>reinvertir</strong> (volver a comprar filamento) y un 66% que llama neto.
              Apartar una parte fija es una buena costumbre: así nunca te quedás sin material por haber gastado todo lo cobrado.
            </p>
            <p>
              Ojo: ese 66% no es la ganancia. La ganancia real es lo cobrado menos lo que costó de verdad cada pieza (en el Panel). Si alguna compra
              de filamento la pagaste con plata de las ventas, cambiala a “caja” en Compras y se descuenta acá.
            </p>
          </Explica>
        </Hoja>
      </div>

      <Seccion titulo="Aportes y retiros">
        {d.capital.length === 0 ? (
          <Vacio>Todavía no registraste aportes ni retiros.</Vacio>
        ) : (
          <ul className="divide-y divide-linea border border-linea bg-hoja">
            {d.capital.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <span>
                  <span className="font-medium">{m.tipo === 'aporte' ? 'Aporte' : 'Retiro'}</span> · {fecha(m.fecha)}
                  {m.nota && <span className="block text-sm text-tenue">{m.nota}</span>}
                </span>
                <span className="flex items-center gap-3">
                  <span className={m.tipo === 'aporte' ? '' : 'text-gana'}>{plata(m.monto)}</span>
                  <Accion accion={borrar.bind(null, 'capital', m.id)} confirmar="¿Borrar este movimiento?">
                    Borrar
                  </Accion>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Seccion>
    </Pagina>
  );
}
