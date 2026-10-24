'use client';

import { useState } from 'react';
import { Formulario, Enviar } from '@/components/formulario';
import { crearImpresion } from '@/app/acciones';
import { costoDeImpresion, precioSugerido } from '@/lib/calculos';
import { plata, plataFina, gramos as fmtGramos, leerNumero } from '@/lib/formato';

const aNumero = (v) => leerNumero(v) || 0;

// Carga de una impresión con el costo calculado mientras se completa.
export default function FormImpresion({ hoy, maquinas, lotes, piezas, productos, precioKwh, costoGramo, multiplicador, multiplicadorMayor }) {
  const primerLote = lotes[0]?.id ?? '';
  const [filas, setFilas] = useState([{ lote: primerLote, gramos: '' }]);
  const [maquinaId, setMaquinaId] = useState(maquinas[0]?.id ?? '');
  const [horas, setHoras] = useState('');
  const [unidades, setUnidades] = useState('1');
  const [pieza, setPieza] = useState('');
  const [producto, setProducto] = useState('');
  const [destino, setDestino] = useState('venta');

  const maquina = maquinas.find((m) => m.id === maquinaId);
  const porLote = Object.fromEntries(lotes.map((l) => [l.id, l]));
  const costo = costoDeImpresion({
    horas: aNumero(horas),
    filamentos: filas.map((f) => ({ gramos: aNumero(f.gramos), costo_gramo: porLote[f.lote]?.costoGramo ?? costoGramo })),
    maquina,
    precioKwh,
  });
  const cantidad = Math.max(1, aNumero(unidades));

  const elegirProducto = (id) => {
    setProducto(id);
    const p = productos.find((x) => x.id === id);
    if (p) {
      setPieza(p.nombre);
      if (p.gramos_unidad) setFilas([{ lote: filas[0]?.lote ?? primerLote, gramos: String(p.gramos_unidad * cantidad) }]);
      if (p.horas_unidad) setHoras(String(p.horas_unidad * cantidad));
    }
  };
  const cambiarFila = (i, cambio) => setFilas((actual) => actual.map((f, j) => (j === i ? { ...f, ...cambio } : f)));
  const reiniciar = () => {
    setFilas([{ lote: primerLote, gramos: '' }]);
    setHoras('');
    setUnidades('1');
    setPieza('');
    setProducto('');
    setDestino('venta');
  };

  return (
    <Formulario accion={crearImpresion} alTerminar={reiniciar} className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Producto</span>
          <select name="producto_id" value={producto} onChange={(e) => elegirProducto(e.target.value)} className="entrada">
            <option value="">Pieza única</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Pieza</span>
          <input name="pieza" required value={pieza} onChange={(e) => setPieza(e.target.value)} className="entrada" placeholder="Ej: llavero con nombre" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Fecha</span>
          <input name="fecha" type="date" defaultValue={hoy} required className="entrada" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Máquina</span>
          <select name="maquina_id" value={maquinaId} onChange={(e) => setMaquinaId(e.target.value)} className="entrada">
            <option value="">Sin indicar</option>
            {maquinas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Horas de impresión</span>
          <input name="horas" inputMode="decimal" value={horas} onChange={(e) => setHoras(e.target.value)} className="entrada" placeholder="Ej: 2,5" />
          <span className="mt-1 block text-xs text-tenue">La que muestra el laminador (Bambu Studio, Cura…).</span>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Unidades</span>
          <input name="unidades" inputMode="numeric" value={unidades} onChange={(e) => setUnidades(e.target.value)} required className="entrada" />
        </label>

        <fieldset className="sm:col-span-2">
          <legend className="mb-1 text-sm font-medium">Filamento usado</legend>
          <div className="space-y-2">
            {filas.map((f, i) => (
              <div key={i} className="flex gap-2">
                <select
                  name="lote"
                  aria-label={`Lote ${i + 1}`}
                  value={f.lote}
                  onChange={(e) => cambiarFila(i, { lote: e.target.value })}
                  className="entrada min-w-0 flex-1"
                >
                  {lotes.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nombre} · {plataFina(l.costoGramo)}/g · quedan {fmtGramos(l.quedan)}
                    </option>
                  ))}
                  <option value="">Sin lote · {plataFina(costoGramo)}/g</option>
                </select>
                <input
                  name="gramos"
                  aria-label={`Gramos del lote ${i + 1}`}
                  inputMode="decimal"
                  placeholder="Gramos"
                  value={f.gramos}
                  onChange={(e) => cambiarFila(i, { gramos: e.target.value })}
                  className="entrada w-28"
                />
                {filas.length > 1 && (
                  <button type="button" aria-label="Quitar filamento" onClick={() => setFilas((a) => a.filter((_, j) => j !== i))} className="boton-suave min-h-11">
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setFilas((a) => [...a, { lote: primerLote, gramos: '' }])} className="boton-suave">
              + Otro color (AMS)
            </button>
          </div>
        </fieldset>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Para qué es</span>
          <select name="destino" value={destino} onChange={(e) => setDestino(e.target.value)} className="entrada">
            <option value="venta">Para una venta</option>
            <option value="stock">Stock (para vender después)</option>
            <option value="propia">Para mí, la casa o la familia</option>
            <option value="regalo">Regalo</option>
            <option value="prueba">Prueba o calibración</option>
          </select>
        </label>
        {destino === 'venta' && (
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Pieza de la venta</span>
            <select name="venta_item_id" required className="entrada" defaultValue="">
              <option value="" disabled>
                {piezas.length ? 'Elegí la venta' : 'Primero cargá la venta'}
              </option>
              {piezas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
        {destino === 'propia' && (
          <>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Para quién</span>
              <input name="para" className="entrada" placeholder="Ej: Casa, Mamá, la impresora" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Cuánto costaría comprarla</span>
              <input name="valor" inputMode="decimal" className="entrada" placeholder="0" />
              <span className="mt-1 block text-xs text-tenue">Lo que te ahorrás por imprimirla vos.</span>
            </label>
          </>
        )}
        <label className="flex min-h-11 items-center gap-2 self-end text-sm">
          <input type="checkbox" name="fallida" className="h-5 w-5" />
          Salió mal (fallida)
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block font-medium">Notas</span>
          <input name="notas" className="entrada" />
        </label>
      </div>

      <aside className="h-fit border border-linea bg-papel p-4 text-sm" aria-live="polite">
        <p className="font-semibold">Costo de esta impresión</p>
        <dl className="mt-3 space-y-1">
          {[
            ['Filamento', costo.material],
            ['Luz', costo.luz],
            ['Desgaste de la máquina', costo.desgaste],
          ].map(([n, v]) => (
            <div key={n} className="flex justify-between gap-3">
              <dt className="text-tenue">{n}</dt>
              <dd>{plata(v)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-3 border-t border-linea pt-1 font-semibold">
            <dt>Total</dt>
            <dd>{plata(costo.total)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-tenue">Por unidad</dt>
            <dd>{plata(costo.total / cantidad)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-tenue">Precio sugerido por unidad (filamento × {multiplicador})</p>
        <p className="text-2xl font-bold">{plata(precioSugerido(costo.material / cantidad, multiplicador))}</p>
        <p className="mt-2 text-tenue">Por mayor (× {multiplicadorMayor})</p>
        <p className="text-lg font-semibold">{plata(precioSugerido(costo.material / cantidad, multiplicadorMayor))}</p>
        <Enviar className="btn btn-primary mt-4 min-h-11 w-full">Guardar impresión</Enviar>
      </aside>
    </Formulario>
  );
}
