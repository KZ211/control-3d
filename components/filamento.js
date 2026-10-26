'use client';

import { useState } from 'react';
import { Formulario, Enviar } from './formulario';
import { avisar } from './avisos';
import { editarFilamento } from '@/app/acciones';
import { gramos as enGramos } from '@/lib/formato';

// Corregir los gramos de un rollo: cuántos rollos y de cuántos gramos eran, y
// (si lo pesaste) cuánto queda hoy. Lo que queda se deja vacío si no lo pesaste.
export function CorregirGramos({ id, nombre, cantidad, porRollo, quedan }) {
  const [abierto, setAbierto] = useState(false);
  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className="btn btn-ghost btn-sm mt-2 min-h-11 px-2 font-medium underline underline-offset-2">
        Corregir gramos
      </button>
    );
  }
  return (
    <Formulario
      accion={editarFilamento.bind(null, id)}
      limpiar={false}
      alTerminar={() => {
        setAbierto(false);
        avisar({ texto: `Gramos de ${nombre} corregidos` });
      }}
      className="mt-3 grid grid-cols-2 gap-2 rounded-box bg-papel p-3 text-sm"
    >
      <label>
        <span className="mb-1 block text-xs text-tenue">Rollos</span>
        <input name="cantidad" inputMode="decimal" defaultValue={cantidad} required className="entrada" />
      </label>
      <label>
        <span className="mb-1 block text-xs text-tenue">Gramos por rollo</span>
        <input name="gramos_por_unidad" inputMode="numeric" defaultValue={porRollo} required className="entrada" />
      </label>
      <label className="col-span-2">
        <span className="mb-1 block text-xs text-tenue">Quedan hoy (si lo pesaste, sin el carrete)</span>
        <input name="quedan" inputMode="decimal" className="entrada" placeholder={`La app calcula ${enGramos(quedan)}`} />
      </label>
      <p className="col-span-2 text-xs text-tenue">Cambiar los gramos por rollo cambia el precio por gramo: el total que pagaste es el mismo.</p>
      <div className="col-span-2 flex justify-end gap-2">
        <button type="button" onClick={() => setAbierto(false)} className="btn btn-ghost min-h-11">
          Cancelar
        </button>
        <Enviar className="btn btn-primary min-h-11">Guardar</Enviar>
      </div>
    </Formulario>
  );
}
