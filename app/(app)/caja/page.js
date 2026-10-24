import { cargar } from '@/lib/datos';
import { plata, fecha } from '@/lib/formato';
import { Pagina, Hoja, Vacio, Explica, Cifra } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function Caja() {
  const d = await cargar();
  const movs = [...d.caja].reverse();

  return (
    <Pagina titulo="Caja" bajada="Cada peso que entró o salió del emprendimiento, y cuánto había después.">
      <Hoja>
        <Cifra grande nombre="Hay en la caja" valor={plata(d.balance.caja)} tono={d.balance.caja < 0 ? 'pierde' : undefined} />
        <Explica titulo="¿Qué es hacer caja?">
          <p>
            La <strong>caja</strong> es la plata real del emprendimiento: lo que cobraste menos lo que pagaste con esa plata. “Hacer caja” o
            “cerrar la caja” es contar la plata que tenés (efectivo + cuenta) y compararla con este número.
          </p>
          <p>
            Si no coinciden, falta registrar algo: un gasto, una compra o plata que sacaste para vos (eso es un retiro, en Tu plata). Conviene
            hacerlo una vez por semana.
          </p>
          <p>Lo que pagaste de tu bolsillo no aparece acá: no salió de la caja.</p>
          {d.balance.caja < 0 && (
            <p className="font-medium text-pierde">
              La caja está en negativo: registraste más salidas que entradas. Seguramente algo se pagó de tu bolsillo y está cargado como “caja”.
            </p>
          )}
        </Explica>
      </Hoja>

      {movs.length === 0 ? (
        <Vacio>Todavía no hay movimientos. Aparecen al cobrar ventas, pagar con la caja o registrar aportes y retiros.</Vacio>
      ) : (
        <div className="overflow-x-auto border border-linea bg-hoja">
          <table className="tabla min-w-[36rem]">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Movimiento</th>
                <th className="num">Entró</th>
                <th className="num">Salió</th>
                <th className="num">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {movs.map((m, i) => (
                <tr key={i}>
                  <td className="whitespace-nowrap">{fecha(m.fecha)}</td>
                  <td>
                    {m.concepto}
                    {m.nota && <span className="block text-xs text-tenue">{m.nota}</span>}
                  </td>
                  <td className="num text-gana">{m.monto > 0 ? plata(m.monto) : ''}</td>
                  <td className="num text-pierde">{m.monto < 0 ? plata(-m.monto) : ''}</td>
                  <td className="num font-medium">{plata(m.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Pagina>
  );
}
