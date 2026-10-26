'use client';

import { useState } from 'react';
import { Formulario, Enviar } from './formulario';
import Monto from './monto';
import Icono from './iconos';
import { avisar } from './avisos';
import { cargarInventario, contarCaja, deshacerConteo, deshacerInventario } from '@/app/acciones';
import { plata, gramos as enGramos, leerNumero } from '@/lib/formato';

const aNumero = (v) => leerNumero(v) || 0;

// Contar la plata del emprendimiento que hay de verdad. La diferencia con lo
// que calcula la app queda como un retiro tuyo (o un aporte, si sobra).
export function ContarCaja({ calculado, hayPunto }) {
  const [contado, setContado] = useState('');
  const escrito = contado.trim() !== '';
  const diferencia = aNumero(contado) - calculado;
  return (
    <Formulario
      accion={contarCaja}
      alTerminar={(r) => {
        setContado('');
        avisar({
          texto:
            Math.abs(r.diferencia) < 1
              ? 'Caja contada: coincide con la app'
              : `Caja contada: ${r.diferencia < 0 ? 'retiro' : 'aporte'} de ${plata(Math.abs(r.diferencia))}`,
          deshacer: () => deshacerConteo(r.conteo, r.puntoAntes),
        });
      }}
      className="grid gap-3"
    >
      <label className="text-sm">
        <span className="mb-1 block font-medium">¿Cuánta plata del emprendimiento tenés hoy?</span>
        <Monto name="contado" value={contado} alCambiar={setContado} required />
        <span className="mt-1 block text-xs text-tenue">Efectivo más lo que tengas en la cuenta o Mercado Pago para el emprendimiento.</span>
      </label>
      <p className="rounded-box bg-papel px-3 py-2 text-sm" aria-live="polite">
        La app calcula <strong>{plata(calculado)}</strong>.
        {escrito &&
          (Math.abs(diferencia) < 1 ? (
            <> Coincide: no hace falta registrar nada.</>
          ) : diferencia < 0 ? (
            <>
              {' '}
              Faltan <strong className="text-pierde">{plata(-diferencia)}</strong>: se registran como un retiro tuyo (plata del emprendimiento que usaste).
            </>
          ) : (
            <>
              {' '}
              Sobran <strong className="text-gana">{plata(diferencia)}</strong>: se registran como un aporte tuyo.
            </>
          ))}
      </p>
      {hayPunto ? (
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" name="punto_partida" className="checkbox checkbox-sm" />
          Empezar a repartir las ventas desde hoy (nuevo punto de partida)
        </label>
      ) : (
        <p className="text-xs text-tenue">
          Este primer conteo es tu punto de partida: desde hoy, cada venta se reparte entre reponer, cuotas, desgaste y lo que podés sacar.
        </p>
      )}
      <Enviar className="btn btn-primary min-h-11" deshabilitado={!escrito}>
        Guardar conteo
      </Enviar>
    </Formulario>
  );
}

const fila = () => ({ material: 'PLA', color: '', rollos: '', gramos: '1000', precio: '' });

// El filamento que tenés hoy, rollo por rollo y a precio de hoy (lo que cuesta
// reponerlo). No es un gasto: ya lo tenías.
export function InventarioFilamento({ rollosViejos }) {
  const [abierto, setAbierto] = useState(false);
  const [filas, setFilas] = useState([fila()]);
  const cambiar = (i, cambio) => setFilas((a) => a.map((f, j) => (j === i ? { ...f, ...cambio } : f)));
  const totalGramos = filas.reduce((s, f) => s + aNumero(f.rollos) * (aNumero(f.gramos) || 1000), 0);
  const valor = filas.reduce((s, f) => s + aNumero(f.rollos) * aNumero(f.precio), 0);

  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className="btn btn-primary min-h-11">
        <Icono nombre="sumar" className="h-4 w-4" /> Cargar el filamento que tengo hoy
      </button>
    );
  }
  return (
    <Formulario
      accion={cargarInventario}
      alTerminar={(r) => {
        setAbierto(false);
        setFilas([fila()]);
        avisar({ texto: 'Filamento de hoy cargado', deshacer: () => deshacerInventario(r.nuevas, r.agotados) });
      }}
      className="tarjeta grid gap-3 p-4"
    >
      <div>
        <h2 className="font-semibold">El filamento que tenés hoy</h2>
        <p className="text-sm text-tenue">
          Contá los rollos y poné cuánto sale hoy cada uno: es lo que va a costar reponerlos. No se cuenta como gasto, porque ya los tenías.
        </p>
      </div>
      <ul className="space-y-2">
        {filas.map((f, i) => (
          <li key={i} className="grid grid-cols-2 gap-2 rounded-box bg-papel p-2 sm:grid-cols-[1fr_1fr_5rem_6rem_8rem_auto] sm:items-end">
            <label className="text-xs text-tenue">
              Material
              <input
                name="material"
                value={f.material}
                onChange={(e) => cambiar(i, { material: e.target.value })}
                className="entrada mt-1 text-sm text-tinta"
                placeholder="PLA"
              />
            </label>
            <label className="text-xs text-tenue">
              Color
              <input
                name="color"
                value={f.color}
                onChange={(e) => cambiar(i, { color: e.target.value })}
                className="entrada mt-1 text-sm text-tinta"
                placeholder="Negro"
              />
            </label>
            <label className="text-xs text-tenue">
              Rollos
              <input
                name="rollos"
                inputMode="decimal"
                value={f.rollos}
                onChange={(e) => cambiar(i, { rollos: e.target.value })}
                className="entrada mt-1 text-sm text-tinta"
                placeholder="0"
              />
            </label>
            <label className="text-xs text-tenue">
              Gramos c/u
              <input
                name="gramos"
                inputMode="numeric"
                value={f.gramos}
                onChange={(e) => cambiar(i, { gramos: e.target.value })}
                className="entrada mt-1 text-sm text-tinta"
              />
            </label>
            <label className="col-span-2 text-xs text-tenue sm:col-span-1">
              Precio de hoy del rollo
              <Monto name="precio" value={f.precio} alCambiar={(v) => cambiar(i, { precio: v })} className="mt-1" />
            </label>
            {filas.length > 1 && (
              <button
                type="button"
                onClick={() => setFilas((a) => a.filter((_, j) => j !== i))}
                aria-label={`Quitar ${[f.material, f.color].filter(Boolean).join(' ') || 'esta fila'}`}
                className="btn btn-ghost btn-square col-span-2 h-11 min-h-11 w-full sm:col-span-1 sm:w-11"
              >
                <Icono nombre="borrar" className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setFilas((a) => [...a, fila()])} className="btn btn-ghost min-h-11 justify-self-start border border-dashed border-linea">
        <Icono nombre="sumar" className="h-4 w-4" /> Otro material o color
      </button>
      {rollosViejos > 0 && (
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" name="agotar" defaultChecked className="checkbox checkbox-sm" />
          Dar por terminados los {rollosViejos} rollos cargados antes: este inventario los reemplaza.
        </label>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-linea pt-3">
        <p className="text-sm">
          <strong>{enGramos(totalGramos)}</strong> <span className="text-tenue">· reponerlos cuesta</span> <strong>{plata(valor)}</strong>
          {totalGramos > 0 && <span className="text-tenue"> · {plata((valor / totalGramos) * 1000)} el kilo</span>}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setAbierto(false)} className="btn btn-ghost min-h-11">
            Cancelar
          </button>
          <Enviar className="btn btn-primary min-h-11">Guardar mi filamento de hoy</Enviar>
        </div>
      </div>
    </Formulario>
  );
}
