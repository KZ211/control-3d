'use client';

import { useState } from 'react';
import { Formulario, Enviar } from '@/components/formulario';
import { crearCompra } from '@/app/acciones';

const CATEGORIAS = [
  ['filamento', 'Filamento'],
  ['maquina', 'Máquina'],
  ['accesorio', 'Accesorio'],
  ['repuesto', 'Repuesto'],
  ['insumo', 'Insumo'],
  ['otro', 'Otro'],
];

export default function FormCompra({ hoy, maquinas }) {
  const [categoria, setCategoria] = useState('filamento');
  const [forma, setForma] = useState('caja');
  const reiniciar = () => {
    setCategoria('filamento');
    setForma('caja');
  };

  return (
    <Formulario accion={crearCompra} alTerminar={reiniciar} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <fieldset className="sm:col-span-2 lg:col-span-4">
        <legend className="mb-1 text-sm font-medium">Qué es</legend>
        <input type="hidden" name="categoria" value={categoria} />
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIAS.map(([v, n]) => (
            <button
              key={v}
              type="button"
              aria-pressed={categoria === v}
              onClick={() => setCategoria(v)}
              className={`btn btn-sm min-h-10 border-linea font-medium ${categoria === v ? 'btn-neutral' : 'btn-ghost border bg-hoja'}`}
            >
              {n}
            </button>
          ))}
        </div>
        {categoria === 'accesorio' && <p className="mt-1 text-xs text-tenue">AMS, cama, hotend… Se suma al precio de la impresora que elijas.</p>}
        {categoria === 'insumo' && <p className="mt-1 text-xs text-tenue">Fijador, lijas, pegamento… Cuenta como gasto del mes.</p>}
      </fieldset>
      <label className="block text-sm sm:col-span-2">
        <span className="mb-1 block font-medium">Descripción</span>
        <input name="descripcion" required className="entrada" placeholder={categoria === 'filamento' ? 'Ej: PLA Grilon3' : ''} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Fecha</span>
        <input name="fecha" type="date" defaultValue={hoy} required className="entrada" />
      </label>

      {categoria === 'filamento' && (
        <>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Material</span>
            <input name="material" className="entrada" placeholder="PLA, PETG…" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Color</span>
            <input name="color" className="entrada" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Rollos</span>
            <input name="cantidad" inputMode="decimal" defaultValue="1" required className="entrada" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Gramos por rollo</span>
            <input name="gramos_por_unidad" inputMode="numeric" defaultValue="1000" className="entrada" />
          </label>
        </>
      )}
      {categoria !== 'filamento' && (
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Cantidad</span>
          <input name="cantidad" inputMode="decimal" defaultValue="1" required className="entrada" />
        </label>
      )}
      {['maquina', 'accesorio', 'repuesto'].includes(categoria) && (
        <label className="block text-sm">
          <span className="mb-1 block font-medium">De qué impresora</span>
          <select name="maquina_id" className="entrada" defaultValue="">
            <option value="">Ninguna en particular</option>
            {maquinas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
          {categoria === 'maquina' && <span className="mt-1 block text-xs text-tenue">Si es una impresora nueva, cargala desde Máquinas.</span>}
        </label>
      )}

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Total pagado</span>
        <input name="total" inputMode="decimal" required className="entrada" placeholder="Precio de todo" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Con qué plata</span>
        <select name="forma_pago" value={forma} onChange={(e) => setForma(e.target.value)} className="entrada">
          <option value="caja">De la caja (lo que generan las ventas)</option>
          <option value="bolsillo">De mi bolsillo (quiero recuperarla)</option>
          <option value="cuotas">En cuotas</option>
        </select>
      </label>
      {forma === 'cuotas' && (
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Cantidad de cuotas</span>
          <input name="cuotas" inputMode="numeric" required className="entrada" />
        </label>
      )}
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Dónde la compraste</span>
        <input name="proveedor" className="entrada" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Notas</span>
        <input name="notas" className="entrada" />
      </label>
      <div className="sm:col-span-2 lg:col-span-4">
        <Enviar className="btn btn-primary min-h-11">Guardar compra</Enviar>
      </div>
    </Formulario>
  );
}
