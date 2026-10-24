import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';
import { construir } from './calculos';

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
// de más nueva a más vieja.
export async function cargar() {
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
}
