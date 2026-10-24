import { cargar } from '@/lib/datos';
import { plata, fecha, hoy } from '@/lib/formato';
import { Pagina, Vacio, Dato } from '@/components/ui';
import { Anillo } from '@/components/graficos';
import { Accion, Formulario, Enviar } from '@/components/formulario';
import { borrar, pagarCuota } from '@/app/acciones';

export const dynamic = 'force-dynamic';

export default async function Cuotas() {
  const d = await cargar();
  const enCuotas = d.compras.filter((c) => c.forma_pago === 'cuotas');
  const debe = enCuotas.reduce((s, c) => s + c.debe, 0);
  const mensual = enCuotas.filter((c) => c.debe > 0).reduce((s, c) => s + Math.min(c.valorCuota ?? c.debe, c.debe), 0);

  return (
    <Pagina>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Dato className="col-span-2 sm:col-span-1" nombre="Debés en cuotas" valor={plata(debe)} tono={debe ? 'pierde' : undefined} />
        <Dato nombre="Por mes" valor={plata(mensual)} nota="la próxima cuota de todo" />
        <Dato nombre="Compras en cuotas" valor={enCuotas.length} />
      </div>
      {enCuotas.length === 0 ? (
        <Vacio>No tenés compras en cuotas.</Vacio>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {enCuotas.map((c) => (
            <li key={c.id} className="tarjeta p-5">
              <div className="flex items-center gap-5">
                <Anillo valor={c.cuotas ? c.cuotasPagadas / c.cuotas : 0} tamano={110} grosor={11} etiqueta={`${c.cuotasPagadas} de ${c.cuotas} cuotas pagadas`}>
                  <span className="text-2xl font-bold">
                    {c.cuotasPagadas}/{c.cuotas}
                  </span>
                  <span className="text-[11px] text-tenue">cuotas</span>
                </Anillo>
                <div className="min-w-0">
                  <p className="text-lg font-semibold">{c.descripcion}</p>
                  <p className="text-sm text-tenue">Cuotas de {plata(c.valorCuota)}</p>
                  <p className="mt-1 text-sm">
                    Pagaste <strong>{plata(c.pagado)}</strong> de {plata(c.total)}
                  </p>
                  {c.debe > 0 && <p className="text-sm font-semibold text-pierde">Faltan {plata(c.debe)}</p>}
                </div>
              </div>
              {c.debe > 0 ? (
                <Formulario accion={pagarCuota.bind(null, c.id)} className="mt-4 grid grid-cols-2 gap-2 border-t border-linea pt-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
                  <label className="text-sm">
                    <span className="mb-1 block text-xs text-tenue">Monto</span>
                    <input name="monto" inputMode="decimal" defaultValue={Math.round(Math.min(c.valorCuota ?? c.debe, c.debe) * 100) / 100} required className="entrada" />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-xs text-tenue">Fecha</span>
                    <input name="fecha" type="date" defaultValue={hoy()} required className="entrada" />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-xs text-tenue">Pagada con</span>
                    <select name="pagado_con" className="entrada" defaultValue="bolsillo">
                      <option value="bolsillo">Mi bolsillo</option>
                      <option value="caja">La caja</option>
                    </select>
                  </label>
                  <Enviar className="btn btn-primary min-h-11">Pagar cuota</Enviar>
                </Formulario>
              ) : (
                <p className="mt-4 text-sm font-semibold text-gana">Pagada completa</p>
              )}
              {c.pagos.length > 0 && (
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer font-medium text-primary">Pagos ({c.pagos.length})</summary>
                  <ul className="mt-2 space-y-1">
                    {c.pagos.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2">
                        <span>
                          {fecha(p.fecha)} · {plata(p.monto)} · {p.pagado_con === 'caja' ? 'de la caja' : 'de tu bolsillo'}
                        </span>
                        <Accion accion={borrar.bind(null, 'pagos_cuotas', p.id)} confirmar="¿Borrar este pago?">
                          ✕
                        </Accion>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </Pagina>
  );
}
