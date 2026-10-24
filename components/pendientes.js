'use client';

import { useId, useState } from 'react';
import { Formulario, Enviar } from './formulario';
import Monto from './monto';
import Icono from './iconos';
import { avisar } from './avisos';
import { cobrar, deshacerCobro, deshacerEntrega, entregar } from '@/app/acciones';
import { plata, hoy, leerNumero } from '@/lib/formato';

// Una fila de lo que queda por hacer (un encargo, una deuda): lo justo para
// reconocerla y una acción. El formulario se abre recién al tocarla.
export function Pendiente({ titulo, detalle, nota, monto, montoTono = '', boton, principal = true, extra, children }) {
  const [abierto, setAbierto] = useState(false);
  const id = useId();
  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 basis-48">
          <p className="font-semibold">{titulo}</p>
          {detalle && <p className="truncate text-sm">{detalle}</p>}
          {nota && <p className="text-xs text-tenue">{nota}</p>}
        </div>
        {monto && <p className={`shrink-0 text-right font-bold tabular-nums ${montoTono}`}>{monto}</p>}
        <div className="flex shrink-0 gap-2">
          {extra}
          {boton && (
            <button
              type="button"
              onClick={() => setAbierto((v) => !v)}
              aria-expanded={abierto}
              aria-controls={id}
              className={`btn min-h-11 ${abierto ? 'btn-ghost border border-linea' : principal ? 'btn-primary' : 'btn-ghost border border-linea'}`}
            >
              {abierto ? 'Cerrar' : boton}
            </button>
          )}
        </div>
      </div>
      {abierto && (
        <div id={id} className="mt-3 space-y-3 rounded-box bg-papel p-3">
          {children}
        </div>
      )}
    </li>
  );
}

// Cobrar una deuda o entregar un encargo, con el monto que falta ya puesto y
// un aviso para deshacerlo si fue sin querer.
export function CobroRapido({ venta, tipo = 'cobrar' }) {
  const entrega = tipo === 'entregar';
  const quien = venta.cliente ?? 'sin cliente';
  const falta = Math.max(0, Math.round(venta.saldo));
  return (
    <Formulario
      accion={(entrega ? entregar : cobrar).bind(null, venta.id)}
      confirmar={(form) => {
        if (!entrega) return null;
        const monto = leerNumero(form.elements.monto.value) || 0;
        return falta > 0 && !monto ? `¿Lo entregaste sin cobrar nada? Va a quedar debiendo ${plata(falta)}.` : null;
      }}
      alTerminar={(r) =>
        avisar(
          entrega
            ? { texto: `Entregado: ${quien}`, deshacer: () => deshacerEntrega(venta.id, r.fechaAntes, r.cobro) }
            : { texto: `Cobro registrado: ${quien}`, deshacer: () => deshacerCobro(r.cobro) }
        )
      }
      className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2"
    >
      <label className="col-span-2 text-sm">
        <span className="mb-1 block text-xs text-tenue">{entrega ? 'Cobré al entregar' : 'Cuánto te pagó'}</span>
        <Monto name="monto" defaultValue={falta || ''} />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs text-tenue">{entrega ? 'Fecha de entrega' : 'Fecha'}</span>
        <input name="fecha" type="date" defaultValue={hoy()} required className="entrada" />
      </label>
      <input type="hidden" name="medio" value={venta.medio_pago ?? ''} />
      <Enviar className="btn btn-primary min-h-11">
        <Icono nombre="listo" className="h-4 w-4" /> {entrega ? 'Entregado' : 'Cobré'}
      </Enviar>
    </Formulario>
  );
}
