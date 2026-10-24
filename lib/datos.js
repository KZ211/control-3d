import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';
import { construir } from './calculos';
import { hoy } from './formato';

const TABLAS = {
  maquinas: ['maquinas', 'creado'],
  clientes: ['clientes', 'nombre'],
  productos: ['productos', 'nombre'],
  compras: ['compras', 'fecha'],
  pagos: ['pagos_cuotas', 'fecha'],
  ventas: ['ventas', 'fecha'],
  items: ['venta_items', 'creado'],
  cobros: ['cobros', 'fecha'],
  impresiones: ['impresiones', 'fecha'],
  filamentos: ['impresion_filamentos', 'creado'],
  capital: ['capital', 'fecha'],
};

// Trae todo (son pocos datos) y lo pasa por los cálculos. Las listas quedan
// de más nueva a más vieja. Se lee una sola vez por pedido aunque lo usen
// el layout y la página.
export const cargar = cache(async function cargar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const pedidos = Object.entries(TABLAS).map(async ([clave, [tabla, orden]]) => {
    let consulta = supabase.from(tabla).select('*').order(orden, { ascending: orden !== 'fecha' });
    if (orden === 'fecha') consulta = consulta.order('creado', { ascending: false });
    const { data, error } = await consulta;
    if (error) throw new Error(`No se pudo leer ${tabla}: ${error.message}`);
    return [clave, data];
  });
  const filas = Object.fromEntries(await Promise.all(pedidos));
  const { data: ajustes } = await supabase.from('ajustes').select('*').maybeSingle();
  return construir({ ...filas, ajustes });
});

// Lo que necesita la carga rápida de ventas: los clientes de compra más
// reciente primero y los productos más vendidos primero.
export function paraVender(d) {
  const clientes = [...d.clientes]
    .sort((a, b) => (b.ultima ?? '').localeCompare(a.ultima ?? '') || a.nombre.localeCompare(b.nombre))
    .map(({ id, nombre }) => ({ id, nombre }));
  const productos = [...d.productos]
    .sort((a, b) => b.unidades - a.unidades || a.nombre.localeCompare(b.nombre))
    .map(({ id, nombre, gramos_unidad, precio_unidad }) => ({
      id,
      nombre,
      gramos_unidad: Number(gramos_unidad) || 0,
      precio_unidad: precio_unidad == null ? null : Number(precio_unidad),
    }));
  const { costoGramo, multiplicador, multiplicadorMayor } = d.ajustes;
  // Lo cargado hoy (entregadas y encargos), para llevar la cuenta del día.
  const dia = hoy();
  const deHoy = [...d.entregadas, ...d.encargos].filter((v) => v.fecha === dia);
  const delDia = { cantidad: deHoy.length, total: deHoy.reduce((s, v) => s + v.total, 0) };
  return { clientes, productos, costoGramo, multiplicador, multiplicadorMayor, delDia };
}

// Las piezas de ventas a las que se les puede asignar una impresión: primero encargos, después las más nuevas.
export function piezasDeVentas(d) {
  return [...d.encargos, ...d.entregadas].flatMap((v) =>
    v.items.map((r) => ({
      id: r.id,
      nombre: `${v.estado === 'encargo' ? 'Encargo · ' : ''}${v.cliente?.nombre ?? 'Sin cliente'} · ${Number(r.cantidad) !== 1 ? `${Number(r.cantidad)} × ` : ''}${r.descripcion}`,
    }))
  );
}
