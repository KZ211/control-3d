'use client';

import { useState, useTransition } from 'react';
import { Formulario, Enviar } from './formulario';
import Icono from './iconos';
import { avisar } from './avisos';
import { clasificarBambu, conectarBambu, deshacerBambu, desconectarBambu, traerBambu } from '@/app/acciones';
import { fecha, gramos as enGramos } from '@/lib/formato';
import { estadoDe, fallo } from '@/lib/bambu';

const DECISIONES = { venta: 'De una venta', stock: 'Stock', prueba: 'Prueba o falla', ignorar: 'No es del negocio' };
const dia = (iso) => (iso ? new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }) : null);

export function duracion(segundos) {
  const min = Math.round((segundos || 0) / 60);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}`;
}

// El color del AMS viene como RRGGBBAA.
const colorDe = (hex) => (/^[0-9a-f]{6}/i.test(hex ?? '') ? `#${hex.slice(0, 6)}` : null);

const cuantas = (n) => `${n} ${n === 1 ? 'impresión' : 'impresiones'}`;

// Trae lo nuevo de la nube de Bambu y avisa cuántas llegaron.
export function BotonTraer({ className = 'btn btn-primary min-h-11' }) {
  const [trayendo, empezar] = useTransition();
  const [error, setError] = useState(null);
  const traer = () =>
    empezar(async () => {
      setError(null);
      const r = await traerBambu();
      if (r?.error) return setError(r.error);
      avisar({ texto: r.nuevas ? `Llegaron ${cuantas(r.nuevas)} nuevas` : 'No hay impresiones nuevas' });
    });
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button type="button" onClick={traer} disabled={trayendo} className={className}>
        {trayendo ? <span className="loading loading-spinner loading-sm" aria-hidden="true" /> : <Icono nombre="traer" className="h-4 w-4" />}
        {trayendo ? 'Trayendo…' : 'Traer impresiones'}
      </button>
      {error && (
        <span role="alert" className="max-w-xs text-right text-sm font-medium text-pierde">
          {error}
        </span>
      )}
    </span>
  );
}

// Las impresiones por revisar: cada una se pasa a una venta, a stock, a prueba
// o se descarta. Se pueden elegir varias para hacerlo de una vez.
export function Bandeja({ pendientes, piezas }) {
  const [elegidas, setElegidas] = useState(() => new Set());
  const [abierta, setAbierta] = useState(null);
  const [pieza, setPieza] = useState('');
  const [error, setError] = useState(null);
  const [guardando, empezar] = useTransition();

  const alternar = (id) =>
    setElegidas((a) => {
      const b = new Set(a);
      b.has(id) ? b.delete(id) : b.add(id);
      return b;
    });
  const todas = elegidas.size === pendientes.length && pendientes.length > 0;

  const clasificar = (ids, decision, ventaItem) =>
    empezar(async () => {
      setError(null);
      const fd = new FormData();
      ids.forEach((id) => fd.append('id', id));
      fd.set('decision', decision);
      if (ventaItem) fd.set('venta_item_id', ventaItem);
      const r = await clasificarBambu(fd);
      if (r?.error) return setError(r.error);
      setElegidas(new Set());
      setAbierta(null);
      setPieza('');
      avisar({ texto: `${cuantas(r.ids.length)}: ${DECISIONES[decision].toLowerCase()}`, deshacer: () => deshacerBambu(r.ids) });
    });

  // Se llaman como funciones (no como componentes) para que no se vuelvan a montar en cada cambio.
  const acciones = (ids, compacta = false) =>
    [
      ['stock', 'Stock'],
      ['prueba', 'Prueba o falla'],
      ['ignorar', 'No es del negocio'],
    ].map(([d, texto]) => (
      <button
        key={d}
        type="button"
        disabled={guardando}
        onClick={() => clasificar(ids, d)}
        className={`btn btn-ghost min-h-11 border border-linea px-3 ${compacta ? 'btn-sm' : ''}`}
      >
        {texto}
      </button>
    ));

  const elegirVenta = (ids) => (
    <div className="flex flex-wrap items-end gap-2">
      <label className="min-w-0 flex-1 basis-56 text-sm">
        <span className="mb-1 block text-xs text-tenue">¿De qué venta es?</span>
        <select value={pieza} onChange={(e) => setPieza(e.target.value)} className="entrada">
          <option value="" disabled>
            {piezas.length ? 'Elegí la pieza (los encargos van primero)' : 'Primero cargá la venta'}
          </option>
          {piezas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </label>
      <button type="button" disabled={!pieza || guardando} onClick={() => clasificar(ids, 'venta', pieza)} className="btn btn-primary min-h-11">
        <Icono nombre="listo" className="h-4 w-4" /> Es de esta venta
      </button>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 rounded-box border border-linea bg-hoja px-4 py-2">
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={todas}
            onChange={() => setElegidas(todas ? new Set() : new Set(pendientes.map((p) => p.id)))}
            className="checkbox checkbox-sm"
          />
          {elegidas.size ? `${cuantas(elegidas.size)} elegidas` : 'Elegir todas'}
        </label>
        {elegidas.size > 0 && (
          <div className="grid w-full grid-cols-2 gap-2 sm:ml-auto sm:flex sm:w-auto sm:flex-wrap">
            {acciones([...elegidas], true)}
            <button
              type="button"
              onClick={() => setAbierta(abierta === 'varias' ? null : 'varias')}
              className="btn btn-ghost btn-sm min-h-11 border border-linea px-3 font-semibold"
            >
              De una venta
            </button>
          </div>
        )}
      </div>
      {abierta === 'varias' && elegidas.size > 0 && <div className="rounded-box bg-papel p-3">{elegirVenta([...elegidas])}</div>}
      {error && (
        <p role="alert" className="rounded-box bg-pierde/10 px-4 py-2 text-sm font-medium text-pierde">
          {error}
        </p>
      )}

      <ul className="tarjeta divide-y divide-linea">
        {pendientes.map((p) => (
          <li key={p.id} className={`px-4 py-3 ${elegidas.has(p.id) ? 'bg-acento/5' : ''}`}>
            <div className="flex items-start gap-2">
              <label className="-ml-3 flex h-14 w-11 shrink-0 cursor-pointer items-center justify-center">
                <input
                  type="checkbox"
                  checked={elegidas.has(p.id)}
                  onChange={() => alternar(p.id)}
                  aria-label={`Elegir ${p.titulo ?? 'la impresión'}`}
                  className="checkbox checkbox-sm"
                />
              </label>
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-btn bg-papel">
                {p.portada ? (
                  <img
                    src={p.portada}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                ) : (
                  <Icono nombre="taller" className="m-4 h-6 w-6 text-tenue" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {p.titulo || p.diseno || 'Sin nombre'}
                  {(fallo(p.estado) || p.estado === 1) && (
                    <span className={`badge badge-sm ml-2 border-0 font-medium ${fallo(p.estado) ? 'bg-warning/20' : 'bg-papel'}`}>{estadoDe(p.estado)}</span>
                  )}
                </p>
                <p className="text-xs text-tenue">{[p.placa, p.impresora, dia(p.inicio) && fecha(dia(p.inicio))].filter(Boolean).join(' · ')}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="font-medium tabular-nums">{enGramos(p.gramos)}</span>
                  <span className="text-tenue">{duracion(p.segundos)}</span>
                  {(p.filamentos ?? []).map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs text-tenue">
                      <span className="h-3 w-3 rounded-full border border-linea" style={{ background: colorDe(f.color) ?? 'transparent' }} aria-hidden="true" />
                      {f.tipo} {enGramos(f.gramos)}
                    </span>
                  ))}
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:pl-[5.25rem]">
              <button
                type="button"
                onClick={() => setAbierta(abierta === p.id ? null : p.id)}
                aria-expanded={abierta === p.id}
                className={`btn min-h-11 border font-semibold ${abierta === p.id ? 'btn-neutral' : 'btn-ghost border-linea'}`}
              >
                Es de una venta
              </button>
              {acciones([p.id])}
            </div>
            {abierta === p.id && <div className="mt-3 rounded-box bg-papel p-3 sm:ml-[5.25rem]">{elegirVenta([p.id])}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Las ya revisadas, por si te equivocaste: vuelven a la bandeja.
export function Revisadas({ filas }) {
  const [volviendo, empezar] = useTransition();
  return (
    <ul className="divide-y divide-linea text-sm">
      {filas.map((f) => (
        <li key={f.id} className="flex items-center justify-between gap-3 py-1">
          <span className="min-w-0">
            <span className="block truncate font-medium">{f.titulo || f.diseno || 'Sin nombre'}</span>
            <span className="text-xs text-tenue">
              {DECISIONES[f.decision]} · {enGramos(f.gramos)}
              {dia(f.inicio) ? ` · ${fecha(dia(f.inicio))}` : ''}
            </span>
          </span>
          <button
            type="button"
            disabled={volviendo}
            onClick={() =>
              empezar(async () => {
                const r = await deshacerBambu([f.id]);
                avisar({ texto: r?.error ? `No se pudo: ${r.error}` : 'Volvió a la bandeja' });
              })
            }
            className="btn btn-ghost btn-sm min-h-11 shrink-0 underline underline-offset-2"
          >
            Volver a revisar
          </button>
        </li>
      ))}
    </ul>
  );
}

// Ajustes: pegar el token de la cuenta de Bambu Lab, o ver cómo está la conexión.
export function ConexionBambu({ conexion }) {
  const [cambiar, setCambiar] = useState(!conexion);
  const vence = conexion?.vence ? new Date(conexion.vence) : null;
  const vencido = vence && vence < new Date();
  return (
    <div className="space-y-4">
      {conexion && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-box bg-papel p-3 text-sm">
          <p>
            <span className={`font-semibold ${vencido ? 'text-pierde' : 'text-gana'}`}>{vencido ? 'El token venció' : 'Conectada'}</span>
            {vence && !vencido && <span className="text-tenue"> · el token vence el {fecha(dia(conexion.vence))}</span>}
            {conexion.ultima_vez && <span className="text-tenue"> · última vez que trajo impresiones: {fecha(dia(conexion.ultima_vez))}</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {!cambiar && (
              <button type="button" onClick={() => setCambiar(true)} className="btn btn-ghost min-h-11 border border-linea">
                Pegar otro token
              </button>
            )}
            <Formulario
              accion={desconectarBambu}
              confirmar="¿Desconectar Bambu Lab? Se borra el token; lo que ya trajiste y lo que clasificaste queda."
              limpiar={false}
              className="inline"
            >
              <Enviar className="btn btn-ghost min-h-11 text-pierde">Desconectar</Enviar>
            </Formulario>
          </div>
        </div>
      )}
      {cambiar && (
        <Formulario
          accion={conectarBambu}
          alTerminar={(r) => {
            setCambiar(false);
            avisar({ texto: r?.total ? `Conectada: llegaron ${cuantas(r.nuevas)} nuevas` : 'Conectada' });
          }}
          className="grid gap-3"
        >
          <ol className="list-decimal space-y-1 pl-5 text-sm text-tenue">
            <li>
              En la compu, entrá con tu cuenta a <strong className="text-tinta">bambulab.com</strong> o <strong className="text-tinta">makerworld.com</strong>.
            </li>
            <li>
              Abrí las herramientas del navegador (F12) y andá a <strong className="text-tinta">Application → Cookies</strong> (en Firefox, Almacenamiento → Cookies).
            </li>
            <li>
              Copiá el valor de la cookie <strong className="text-tinta">token</strong> y pegalo acá. Dura unos tres meses; cuando venza, la app te avisa.
            </li>
          </ol>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Token de Bambu Lab</span>
            <input name="token" type="password" autoComplete="off" required className="entrada font-mono" placeholder="eyJ…" />
            <span className="mt-1 block text-xs text-tenue">Se guarda solo en tu base de datos y lo usa el servidor; nunca tu contraseña.</span>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Región de la cuenta</span>
            <select name="region" defaultValue={conexion?.region ?? 'global'} className="entrada">
              <option value="global">Global (bambulab.com)</option>
              <option value="china">China (bambulab.cn)</option>
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            <Enviar className="btn btn-primary min-h-11">Conectar y traer impresiones</Enviar>
            {conexion && (
              <button type="button" onClick={() => setCambiar(false)} className="btn btn-ghost min-h-11">
                Cancelar
              </button>
            )}
          </div>
        </Formulario>
      )}
    </div>
  );
}
