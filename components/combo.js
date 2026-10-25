'use client';

import { useEffect, useState } from 'react';
import Icono from './iconos';
import { armarVenta } from './dialogo-venta';
import { plata, num } from '@/lib/formato';

// Tilde para elegir una impresión de stock y armar con varias una sola venta.
export function ElegirParaVenta({ id, nombre }) {
  return (
    <label className="flex h-11 w-11 cursor-pointer items-center justify-center">
      <input type="checkbox" data-combo={id} aria-label={`Elegir ${nombre} para armar una venta`} className="checkbox checkbox-sm" />
    </label>
  );
}

// La barra que aparece al elegir impresiones de stock: cuántas, los gramos y
// el costo sumados, y el botón para guardarlas como una sola venta.
export function BarraCombo({ disponibles }) {
  const [elegidas, setElegidas] = useState([]);
  useEffect(() => {
    const leer = () => setElegidas([...document.querySelectorAll('input[data-combo]:checked')].map((e) => e.dataset.combo));
    const cambio = (e) => e.target.matches?.('input[data-combo]') && leer();
    document.addEventListener('change', cambio);
    leer();
    return () => document.removeEventListener('change', cambio);
  }, []);
  const lista = disponibles.filter((i) => elegidas.includes(i.id));
  if (!lista.length) return null;
  const limpiar = () => {
    document.querySelectorAll('input[data-combo]:checked').forEach((e) => (e.checked = false));
    setElegidas([]);
  };
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 rounded-box border border-linea bg-hoja px-4 py-2" role="status">
      <p className="text-sm">
        <strong>
          {lista.length} {lista.length === 1 ? 'impresión elegida' : 'impresiones elegidas'}
        </strong>
        <span className="text-tenue">
          {' '}
          · {num(lista.reduce((s, i) => s + i.gramos, 0))} g · costo {plata(lista.reduce((s, i) => s + i.costo, 0))}
        </span>
      </p>
      <div className="ml-auto flex gap-2">
        <button type="button" onClick={limpiar} className="btn btn-ghost btn-sm min-h-11">
          Limpiar
        </button>
        <button type="button" onClick={() => armarVenta('impresiones', lista)} className="btn btn-primary btn-sm min-h-11 px-3">
          <Icono nombre="sumar" className="h-4 w-4" /> Armar una venta
        </button>
      </div>
    </div>
  );
}
