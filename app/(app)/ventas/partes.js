import { plata } from '@/lib/formato';

export function Renglones({ venta }) {
  return (
    <ul className="space-y-1 text-sm">
      {venta.items.map((r) => (
        <li key={r.id} className="flex justify-between gap-3">
          <span>
            {Number(r.cantidad) !== 1 && <span className="font-semibold">{Number(r.cantidad)} × </span>}
            {r.descripcion}
          </span>
          <span className="shrink-0">{plata(r.precio)}</span>
        </li>
      ))}
    </ul>
  );
}

// Lo que necesita la ventana para editar una venta (solo datos simples).
export function paraEditar(v) {
  return {
    id: v.id,
    estado: v.estado,
    fecha: v.fecha,
    cliente: v.cliente?.nombre ?? '',
    gastos: Number(v.gastos) || 0,
    notas: v.notas ?? '',
    cobrado: v.cobrado,
    medio: v.medio_pago ?? '',
    // El costo que ya tiene cada pieza, para que la edición muestre la misma ganancia que el detalle.
    items: v.items.map((r) => ({
      id: r.id,
      producto_id: r.producto_id,
      descripcion: r.descripcion,
      cantidad: Number(r.cantidad) || 1,
      gramos: Number(r.gramos_unidad) || 0,
      precio: Number(r.precio) || 0,
      costoUnidad: r.estimado ? null : r.costo / (Number(r.cantidad) || 1),
      costoGramo: Number(r.costo_gramo) || null,
    })),
  };
}

// Lo que necesita el formulario de cobro o entrega (solo datos simples).
export function paraCobrar(v) {
  return { id: v.id, saldo: v.saldo, medio_pago: v.medio_pago ?? '', cliente: v.cliente?.nombre ?? null };
}

// Cuánto se cobró de una venta, como barra.
export function Cobrado({ venta }) {
  if (!venta.total) {
    return <p className="text-xs text-tenue">{venta.cobrado ? `Seña ${plata(venta.cobrado)} · falta ponerle precio` : 'Todavía no tiene precio'}</p>;
  }
  const parte = venta.total ? Math.min(1, venta.cobrado / venta.total) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-tenue">
        <span>
          Cobrado {plata(venta.cobrado)} de {plata(venta.total)}
        </span>
        <span className="font-semibold text-tinta">{Math.round(parte * 100)}%</span>
      </div>
      <progress className="progress progress-success mt-1 h-2 w-full" value={parte * 100} max="100" aria-label={`Cobrado ${Math.round(parte * 100)}%`} />
    </div>
  );
}
