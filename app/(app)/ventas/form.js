'use client';

import { useState } from 'react';
import { Formulario, Enviar } from '@/components/formulario';
import { crearVenta } from '../../acciones';
import { precioSugerido } from '@/lib/calculos';
import { plata, leerNumero } from '@/lib/formato';

const aNumero = (v) => leerNumero(v) || 0;
const vacio = () => ({ producto: '', descripcion: '', cantidad: '1', gramos: '', precio: '' });

// Una venta con uno o varios renglones (piezas). Muestra el costo estimado y
// el precio sugerido de cada renglón mientras se completa.
export default function FormVenta({ hoy, clientes, productos, costoGramo, multiplicador, multiplicadorMayor }) {
  const [filas, setFilas] = useState([vacio()]);
  const [pagoTodo, setPagoTodo] = useState(true);
  const [estado, setEstado] = useState('entregada');
  const porId = Object.fromEntries(productos.map((p) => [p.id, p]));

  const cambiar = (i, cambio) => setFilas((actual) => actual.map((f, j) => (j === i ? { ...f, ...cambio } : f)));
  const elegirProducto = (i, id) => {
    const p = porId[id];
    const cantidad = aNumero(filas[i].cantidad) || 1;
    cambiar(
      i,
      p
        ? { producto: id, descripcion: p.nombre, gramos: String(p.gramos_unidad ?? ''), precio: p.precio_unidad ? String(p.precio_unidad * cantidad) : '' }
        : { producto: '' }
    );
  };
  const cambiarCantidad = (i, valor) => {
    const p = porId[filas[i].producto];
    // Con un producto de precio conocido, el total sigue a la cantidad.
    cambiar(i, p?.precio_unidad ? { cantidad: valor, precio: String(p.precio_unidad * (aNumero(valor) || 1)) } : { cantidad: valor });
  };
  const reiniciar = () => {
    setFilas([vacio()]);
    setPagoTodo(true);
    setEstado('entregada');
  };

  const calculo = filas.map((f) => {
    const costo = aNumero(f.cantidad) * aNumero(f.gramos) * costoGramo;
    return { costo, sugerido: precioSugerido(costo, multiplicador), mayor: precioSugerido(costo, multiplicadorMayor), precio: aNumero(f.precio) };
  });
  const total = calculo.reduce((s, c) => s + c.precio, 0);
  const costo = calculo.reduce((s, c) => s + c.costo, 0);

  return (
    <Formulario accion={crearVenta} alTerminar={reiniciar} className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block font-medium">Cliente</span>
          <input name="cliente" list="lista-clientes" autoComplete="off" className="entrada" placeholder="Escribí o elegí uno" />
          <datalist id="lista-clientes">
            {clientes.map((c) => (
              <option key={c.id} value={c.nombre} />
            ))}
          </datalist>
          <span className="mt-1 block text-xs text-tenue">Si es nuevo, se crea solo.</span>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Fecha</span>
          <input name="fecha" type="date" defaultValue={hoy} required className="entrada" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Estado</span>
          <select name="estado" value={estado} onChange={(e) => setEstado(e.target.value)} className="entrada">
            <option value="entregada">Entregada</option>
            <option value="encargo">Encargo (falta hacerla o entregarla)</option>
          </select>
        </label>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Qué vendiste</legend>
        <div className="space-y-3">
          {filas.map((f, i) => (
            <div key={i} className="grid gap-2 border border-linea bg-papel p-3 sm:grid-cols-[1fr_1.4fr_5rem_6rem_8rem_auto] sm:items-end">
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-tenue">Producto</span>
                <select name="item_producto" value={f.producto} onChange={(e) => elegirProducto(i, e.target.value)} className="entrada">
                  <option value="">Pieza única</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-tenue">Descripción</span>
                <input
                  name="item_descripcion"
                  required={i === 0}
                  value={f.descripcion}
                  onChange={(e) => cambiar(i, { descripcion: e.target.value })}
                  className="entrada"
                  placeholder="Ej: Portafigu dorado"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-tenue">Cantidad</span>
                <input name="item_cantidad" inputMode="decimal" value={f.cantidad} onChange={(e) => cambiarCantidad(i, e.target.value)} className="entrada" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-tenue">Gramos c/u</span>
                <input name="item_gramos" inputMode="decimal" value={f.gramos} onChange={(e) => cambiar(i, { gramos: e.target.value })} className="entrada" placeholder="0" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-tenue">Precio total</span>
                <input name="item_precio" inputMode="decimal" value={f.precio} onChange={(e) => cambiar(i, { precio: e.target.value })} className="entrada" placeholder="0" />
              </label>
              <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-end">
                <p className="text-xs text-tenue sm:text-right">
                  Costo {plata(calculo[i].costo)}
                  <br />
                  Sugerido {plata(calculo[i].sugerido)}
                  <br />
                  Por mayor {plata(calculo[i].mayor)}
                </p>
                {filas.length > 1 && (
                  <button type="button" aria-label={`Quitar renglón ${i + 1}`} onClick={() => setFilas((a) => a.filter((_, j) => j !== i))} className="boton-suave">
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setFilas((a) => [...a, vacio()])} className="boton-suave mt-3">
          + Otra pieza
        </button>
        <p className="mt-2 text-xs text-tenue">
          El costo se estima con {plata(costoGramo)} por gramo y el sugerido es costo × {multiplicador} (× {multiplicadorMayor} por mayor), como en tu planilla. Si después cargás las
          impresiones de la venta, manda el costo real.
        </p>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Envío o comisiones que pagás vos</span>
          <input name="gastos" inputMode="decimal" className="entrada" placeholder="0" />
          <span className="mt-1 block text-xs text-tenue">Si el envío lo paga el cliente, sumalo como otra pieza.</span>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Medio de pago</span>
          <select name="medio_pago" className="entrada" defaultValue="Transferencia">
            <option>Transferencia</option>
            <option>Efectivo</option>
            <option>Mercado Pago</option>
            <option>Otro</option>
          </select>
        </label>
        <div className="text-sm sm:col-span-2">
          <label className="flex min-h-11 items-center gap-2">
            <input type="checkbox" name="pago_todo" checked={pagoTodo} onChange={(e) => setPagoTodo(e.target.checked)} className="h-5 w-5" />
            Ya me pagó todo
          </label>
          {!pagoTodo && (
            <label className="mt-1 block max-w-xs">
              <span className="mb-1 block font-medium">{estado === 'encargo' ? 'Seña' : 'Cobrado hasta ahora'}</span>
              <input name="cobrado" inputMode="decimal" className="entrada" placeholder="0" />
            </label>
          )}
        </div>
        <label className="block text-sm sm:col-span-2 lg:col-span-4">
          <span className="mb-1 block font-medium">Notas</span>
          <input name="notas" className="entrada" />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-linea pt-4">
        <p className="text-sm" aria-live="polite">
          Total <strong className="text-lg">{plata(total)}</strong>
          <span className="text-tenue">
            {' '}
            · costo {plata(costo)} · te queda {plata(total - costo)}
          </span>
        </p>
        <Enviar>Guardar venta</Enviar>
      </div>
    </Formulario>
  );
}
