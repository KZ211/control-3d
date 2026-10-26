'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { costoPorGramo } from '@/lib/calculos';
import { leerNumero, hoy } from '@/lib/formato';
import { cargar } from '@/lib/datos';
import { normalizar } from '@/lib/nombres';
import { limpiarToken, venceToken, pedirTareas, desdeTarea, gramosPorFilamento, fallo } from '@/lib/bambu';

// Lectura de formularios: vacío es null, los números aceptan coma decimal.
const texto = (fd, k) => {
  const v = fd.get(k)?.toString().trim();
  return v ? v : null;
};
const aNumero = (v) => {
  const n = leerNumero(v);
  if (n !== null && !Number.isFinite(n)) throw new Error(`"${v}" no es un número válido.`);
  return n;
};
const numero = (fd, k) => aNumero(texto(fd, k));

async function conSesion() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return supabase;
}

// Los errores de la base vienen en inglés y técnicos: se muestran en palabras
// simples y el original queda en el registro del servidor.
function explicar(error) {
  console.error(error);
  const m = String(error?.message ?? '');
  if (/fetch|network|timeout|ECONN|ENOTFOUND/i.test(m)) return 'no se pudo conectar con la base de datos; revisá internet';
  // Una tabla, columna o valor que agregó un cambio cuyo SQL todavía no se corrió.
  if (/does not exist|schema cache|could not find the table|forma_pago_check|decision_check/i.test(m)) return 'falta correr un SQL nuevo en Supabase (mirá supabase/cambios)';
  if (/jwt|auth|session|permission|row-level security/i.test(m)) return 'se cerró tu sesión; volvé a entrar';
  if (/violates|constraint|invalid input/i.test(m)) return 'la base de datos rechazó algún dato';
  return 'la base de datos no respondió bien';
}

function revisar({ error }) {
  if (error) throw new Error(explicar(error));
}

function listo() {
  revalidatePath('/', 'layout');
}

// Cada acción devuelve { error } en vez de lanzarlo: en producción Next
// esconde el mensaje de los errores lanzados y el formulario no podría
// mostrarlo. Lo que devuelva el trabajo (por ejemplo, cómo deshacerlo) viaja
// junto al ok.
async function intentar(trabajo) {
  try {
    const extra = await trabajo();
    return { ok: true, ...extra };
  } catch (e) {
    if (String(e?.digest ?? '').startsWith('NEXT_REDIRECT')) throw e;
    return { error: e?.message ?? 'Algo salió mal.' };
  }
}

// Sesión

export async function entrar(_estado, fd) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: texto(fd, 'email') ?? '', password: fd.get('password') ?? '' });
  if (error) return { error: 'Email o contraseña incorrectos.' };
  redirect('/');
}

export async function salir() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

// Máquinas

export async function crearMaquina(fd) {
  return intentar(async () => {
    const db = await conSesion();
    const { data: maquina, error } = await db
      .from('maquinas')
      .insert({
        nombre: texto(fd, 'nombre'),
        vida_util_horas: numero(fd, 'vida_util_horas') ?? 5000,
        consumo_watts: numero(fd, 'consumo_watts') ?? 150,
        notas: texto(fd, 'notas'),
      })
      .select()
      .single();
    revisar({ error });

    // Si cargó el precio, se registra también la compra.
    const precio = numero(fd, 'precio');
    if (precio) {
      const formaPago = texto(fd, 'forma_pago') ?? 'bolsillo';
      revisar(
        await db.from('compras').insert({
          fecha: texto(fd, 'fecha') ?? undefined,
          descripcion: maquina.nombre,
          categoria: 'maquina',
          total: precio,
          forma_pago: formaPago,
          cuotas: formaPago === 'cuotas' ? numero(fd, 'cuotas') : null,
          maquina_id: maquina.id,
        })
      );
    }
    listo();
  });
}

export async function editarMaquina(id, fd) {
  return intentar(async () => {
    const db = await conSesion();
    revisar(
      await db
        .from('maquinas')
        .update({
          vida_util_horas: numero(fd, 'vida_util_horas') ?? 5000,
          consumo_watts: numero(fd, 'consumo_watts') ?? 150,
        })
        .eq('id', id)
    );
    listo();
  });
}

// Compras

export async function crearCompra(fd) {
  return intentar(async () => {
    const db = await conSesion();
    const categoria = texto(fd, 'categoria');
    const formaPago = texto(fd, 'forma_pago') ?? 'bolsillo';
    const conMaquina = ['maquina', 'accesorio', 'repuesto'].includes(categoria);
    const filamento = categoria === 'filamento';
    revisar(
      await db.from('compras').insert({
        fecha: texto(fd, 'fecha') ?? undefined,
        descripcion: texto(fd, 'descripcion'),
        categoria,
        cantidad: numero(fd, 'cantidad') ?? 1,
        total: numero(fd, 'total'),
        forma_pago: formaPago,
        cuotas: formaPago === 'cuotas' ? numero(fd, 'cuotas') : null,
        maquina_id: conMaquina ? texto(fd, 'maquina_id') : null,
        material: filamento ? texto(fd, 'material') : null,
        color: filamento ? texto(fd, 'color') : null,
        gramos_por_unidad: filamento ? numero(fd, 'gramos_por_unidad') ?? 1000 : null,
        proveedor: texto(fd, 'proveedor'),
        notas: texto(fd, 'notas'),
      })
    );
    listo();
  });
}

export async function editarCompra(compraId, fd) {
  return intentar(async () => {
    const db = await conSesion();
    const formaPago = texto(fd, 'forma_pago') ?? 'bolsillo';
    const cambios = {
      fecha: texto(fd, 'fecha') ?? undefined,
      total: numero(fd, 'total') ?? undefined,
      forma_pago: formaPago,
      cuotas: formaPago === 'cuotas' ? numero(fd, 'cuotas') : null,
    };
    if (fd.has('gramos_por_unidad')) cambios.gramos_por_unidad = numero(fd, 'gramos_por_unidad') ?? 1000;
    revisar(await db.from('compras').update(cambios).eq('id', compraId));
    listo();
  });
}

export async function asignarMaquina(compraId, fd) {
  return intentar(async () => {
    const db = await conSesion();
    revisar(await db.from('compras').update({ maquina_id: texto(fd, 'maquina_id') }).eq('id', compraId));
    listo();
  });
}

// Corrige los gramos de un rollo cargado: cuántos rollos y de cuántos gramos
// eran (eso cambia el precio por gramo) y, si lo pesaste, cuánto queda hoy. Lo
// que queda se guarda como la diferencia con lo que calcula la app.
export async function editarFilamento(compraId, fd) {
  return intentar(async () => {
    const cantidad = numero(fd, 'cantidad');
    const porRollo = numero(fd, 'gramos_por_unidad');
    const quedan = numero(fd, 'quedan');
    if (!(cantidad > 0)) throw new Error('Poné cuántos rollos eran.');
    if (!(porRollo > 0)) throw new Error('Poné cuántos gramos trae cada rollo.');
    if (quedan != null && quedan < 0) throw new Error('Lo que queda no puede ser menos que cero.');
    const d = await cargar();
    const lote = d.lotes.find((l) => l.id === compraId);
    if (!lote) throw new Error('No encontré ese rollo.');
    const cambio = { cantidad, gramos_por_unidad: Math.round(porRollo) };
    if (quedan != null) {
      // Lo usado sin la corrección anterior, contra el total nuevo del lote.
      const usado = lote.usados - lote.ajuste;
      cambio.gramos_ajuste = Math.round((cantidad * Math.round(porRollo) - quedan - usado) * 100) / 100;
      if (quedan > 0) cambio.agotado = false;
    }
    const db = await conSesion();
    revisar(await db.from('compras').update(cambio).eq('id', compraId));
    listo();
  });
}

export async function marcarAgotado(compraId, agotado) {
  return intentar(async () => {
    const db = await conSesion();
    revisar(await db.from('compras').update({ agotado }).eq('id', compraId));
    listo();
  });
}

export async function pagarCuota(compraId, fd) {
  return intentar(async () => {
    const db = await conSesion();
    revisar(
      await db.from('pagos_cuotas').insert({
        compra_id: compraId,
        fecha: texto(fd, 'fecha') ?? undefined,
        monto: numero(fd, 'monto'),
        pagado_con: texto(fd, 'pagado_con') ?? 'bolsillo',
      })
    );
    listo();
  });
}

// Clientes y productos

function nombreRepetido(error, que) {
  if (error?.code === '23505') throw new Error(`Ya existe ${que} con ese nombre.`);
  revisar({ error });
}

// Devuelve el id del cliente con ese nombre y lo crea si no existe. "Lucía
// Prima" y "lucia  prima" son el mismo: no importan tildes, mayúsculas ni espacios.
async function buscarOCrearCliente(db, nombre) {
  if (!nombre) return { id: null, creado: false };
  const { data, error } = await db.from('clientes').select('id, nombre');
  revisar({ error });
  const buscado = normalizar(nombre);
  const hay = data.find((c) => normalizar(c.nombre) === buscado);
  if (hay) return { id: hay.id, creado: false };
  const nuevo = await db.from('clientes').insert({ nombre: nombre.replace(/\s+/g, ' ') }).select('id').single();
  revisar(nuevo);
  return { id: nuevo.data.id, creado: true };
}

const clientePorNombre = async (db, nombre) => (await buscarOCrearCliente(db, nombre)).id;

// Junta dos clientes que son la misma persona: las ventas de `origen` pasan a
// `destino`, se completan los datos que le falten y `origen` se borra.
export async function unirClientes(origen, fd) {
  return intentar(async () => {
    const destino = texto(fd, 'destino');
    if (!destino || destino === origen) throw new Error('Elegí con qué cliente unirlo.');
    const db = await conSesion();
    const { data, error } = await db.from('clientes').select('id, contacto, notas').in('id', [origen, destino]);
    revisar({ error });
    const de = data.find((c) => c.id === origen);
    const a = data.find((c) => c.id === destino);
    if (!de || !a) throw new Error('No se encontró uno de los dos clientes.');
    revisar(await db.from('ventas').update({ cliente_id: destino }).eq('cliente_id', origen));
    const notas = [a.notas, de.notas].filter(Boolean).join(' · ') || null;
    revisar(await db.from('clientes').update({ contacto: a.contacto ?? de.contacto, notas }).eq('id', destino));
    revisar(await db.from('clientes').delete().eq('id', origen));
    listo();
  });
}

export async function crearCliente(fd) {
  return intentar(async () => {
    const db = await conSesion();
    const { error } = await db.from('clientes').insert({ nombre: texto(fd, 'nombre'), contacto: texto(fd, 'contacto'), notas: texto(fd, 'notas') });
    nombreRepetido(error, 'un cliente');
    listo();
  });
}

export async function editarCliente(id, fd) {
  return intentar(async () => {
    const db = await conSesion();
    const { error } = await db
      .from('clientes')
      .update({ nombre: texto(fd, 'nombre'), contacto: texto(fd, 'contacto'), notas: texto(fd, 'notas') })
      .eq('id', id);
    nombreRepetido(error, 'un cliente');
    listo();
  });
}

const datosProducto = (fd) => ({
  nombre: texto(fd, 'nombre'),
  gramos_unidad: numero(fd, 'gramos_unidad') ?? 0,
  horas_unidad: numero(fd, 'horas_unidad'),
  precio_unidad: numero(fd, 'precio_unidad'),
  notas: texto(fd, 'notas'),
});

export async function crearProducto(fd) {
  return intentar(async () => {
    const db = await conSesion();
    const { error } = await db.from('productos').insert(datosProducto(fd));
    nombreRepetido(error, 'un producto');
    listo();
  });
}

export async function editarProducto(id, fd) {
  return intentar(async () => {
    const db = await conSesion();
    const { error } = await db.from('productos').update(datosProducto(fd)).eq('id', id);
    nombreRepetido(error, 'un producto');
    listo();
  });
}

// Ventas

async function costoGramoDeAjustes(db) {
  const { data } = await db.from('ajustes').select('costo_gramo').maybeSingle();
  return Number(data?.costo_gramo) || 20;
}

// Los renglones llegan como listas paralelas (item_descripcion, item_cantidad…).
function renglones(fd, costoGramo) {
  const columna = (k) => fd.getAll(k).map((v) => v.toString().trim());
  const descripciones = columna('item_descripcion');
  const productos = columna('item_producto');
  const cantidades = columna('item_cantidad');
  const gramos = columna('item_gramos');
  const precios = columna('item_precio');
  const ids = columna('item_id');
  // El precio del gramo puede venir por pieza desde la venta; si no, el de Ajustes.
  const porGramo = columna('item_costo_gramo');
  return descripciones
    .map((descripcion, i) => ({
      id: ids[i] || null,
      descripcion,
      producto_id: productos[i] || null,
      cantidad: aNumero(cantidades[i]) ?? 1,
      gramos_unidad: aNumero(gramos[i]) ?? 0,
      costo_gramo: aNumero(porGramo[i]) > 0 ? aNumero(porGramo[i]) : costoGramo,
      precio: aNumero(precios[i]) ?? 0,
    }))
    .filter((r) => r.descripcion);
}

// Todo o nada: si falla cualquier paso, se borra lo que se llegó a guardar
// (la venta arrastra sus piezas y cobros, y el cliente si se creó recién).
export async function crearVenta(fd) {
  return intentar(async () => {
    const db = await conSesion();
    const items = renglones(fd, await costoGramoDeAjustes(db));
    if (!items.length) throw new Error('Escribí qué vendiste en al menos una pieza.');
    // Los números se leen antes de guardar nada, así un monto mal escrito no deja la venta a medias.
    const fecha = texto(fd, 'fecha') ?? undefined;
    const gastos = numero(fd, 'gastos') ?? 0;
    const total = items.reduce((s, r) => s + r.precio, 0);
    const cobrado = fd.get('pago_todo') ? total : numero(fd, 'cobrado');
    const medio = texto(fd, 'medio_pago');

    // Una venta armada con varias impresiones (de la bandeja de Bambu o del
    // taller): todas quedan asignadas a la primera pieza.
    const combo = { origen: texto(fd, 'combo_origen'), ids: fd.getAll('combo_id').map(String).filter(Boolean) };

    const cliente = await buscarOCrearCliente(db, texto(fd, 'cliente'));
    let ventaId = null;
    const creadas = [];
    let deBambu = [];
    try {
      const { data: venta, error } = await db
        .from('ventas')
        .insert({
          fecha,
          cliente_id: cliente.id,
          estado: texto(fd, 'estado') === 'encargo' ? 'encargo' : 'entregada',
          gastos,
          medio_pago: medio,
          notas: texto(fd, 'notas'),
        })
        .select('id')
        .single();
      revisar({ error });
      ventaId = venta.id;
      const { data: piezas, error: errorPiezas } = await db
        .from('venta_items')
        .insert(items.map(({ id, ...r }) => ({ ...r, venta_id: ventaId })))
        .select('id');
      revisar({ error: errorPiezas });
      if (cobrado) revisar(await db.from('cobros').insert({ venta_id: ventaId, fecha, monto: cobrado, medio }));
      if (combo.ids.length && combo.origen === 'impresiones') {
        revisar(await db.from('impresiones').update({ venta_item_id: piezas[0].id }).in('id', combo.ids).is('venta_item_id', null));
      }
      if (combo.ids.length && combo.origen === 'bambu') {
        const { data: filas, error } = await db.from('bambu_impresiones').select('*').in('id', combo.ids).eq('decision', 'pendiente');
        revisar({ error });
        deBambu = filas.map((f) => f.id);
        await crearDesdeBambu(db, filas, 'venta', piezas[0].id, creadas);
      }
    } catch (e) {
      // Borrar la venta suelta las impresiones del taller (vuelven a stock); las
      // creadas desde Bambu se borran y vuelven a la bandeja.
      if (creadas.length) await db.from('impresiones').delete().in('id', creadas);
      if (deBambu.length) await db.from('bambu_impresiones').update({ decision: 'pendiente', impresion_id: null }).in('id', deBambu);
      if (ventaId) await db.from('ventas').delete().eq('id', ventaId);
      if (cliente.creado) await db.from('clientes').delete().eq('id', cliente.id);
      throw new Error(`No se guardó nada: ${String(e.message).replace(/\.$/, '')}. Probá de nuevo.`);
    }
    listo();
  });
}

// Edita una venta con el mismo formulario de la carga rápida: los datos de la
// venta y sus piezas. Las piezas que ya estaban conservan su precio por gramo
// (y las impresiones asignadas); las nuevas toman el de Ajustes.
export async function editarVenta(ventaId, fd) {
  return intentar(async () => {
    const db = await conSesion();
    const items = renglones(fd, await costoGramoDeAjustes(db));
    if (!items.length) throw new Error('Una venta necesita al menos una pieza. Si querés sacarla entera, borrala.');
    const gastos = numero(fd, 'gastos') ?? 0;
    const diferencia = numero(fd, 'cobrar_diferencia');
    const estado = texto(fd, 'estado');
    revisar(
      await db
        .from('ventas')
        .update({
          fecha: texto(fd, 'fecha') ?? undefined,
          cliente_id: await clientePorNombre(db, texto(fd, 'cliente')),
          ...(['entregada', 'encargo'].includes(estado) && { estado }),
          medio_pago: texto(fd, 'medio_pago'),
          gastos,
          notas: texto(fd, 'notas'),
        })
        .eq('id', ventaId)
    );
    const { data: antes, error } = await db.from('venta_items').select('id').eq('venta_id', ventaId);
    revisar({ error });
    const quedan = new Set(items.map((r) => r.id).filter(Boolean));
    const sacar = antes.map((r) => r.id).filter((id) => !quedan.has(id));
    if (sacar.length) revisar(await db.from('venta_items').delete().in('id', sacar));
    // El precio del gramo también se actualiza: la venta manda el de cada pieza.
    for (const { id, ...r } of items) {
      if (id) revisar(await db.from('venta_items').update(r).eq('id', id).eq('venta_id', ventaId));
      else revisar(await db.from('venta_items').insert({ ...r, venta_id: ventaId }));
    }
    // Lo que faltaba cobrar después de cambiar los precios, si marcaste que ya lo cobraste.
    if (diferencia > 0) revisar(await db.from('cobros').insert({ venta_id: ventaId, monto: diferencia, medio: texto(fd, 'medio_pago') }));
    listo();
  });
}

// Entregar y cobrar devuelven lo necesario para deshacerlos desde el aviso.
export async function entregar(ventaId, fd) {
  return intentar(async () => {
    const db = await conSesion();
    const fecha = texto(fd, 'fecha') ?? undefined;
    const monto = numero(fd, 'monto');
    const { data: antes, error } = await db.from('ventas').select('fecha').eq('id', ventaId).single();
    revisar({ error });
    revisar(await db.from('ventas').update({ estado: 'entregada', fecha }).eq('id', ventaId));
    let cobro = null;
    if (monto) {
      const { data, error } = await db.from('cobros').insert({ venta_id: ventaId, fecha, monto, medio: texto(fd, 'medio') }).select('id').single();
      revisar({ error });
      cobro = data.id;
    }
    listo();
    return { fechaAntes: antes.fecha, cobro };
  });
}

export async function deshacerEntrega(ventaId, fechaAntes, cobro) {
  return intentar(async () => {
    const db = await conSesion();
    if (cobro) revisar(await db.from('cobros').delete().eq('id', cobro));
    revisar(await db.from('ventas').update({ estado: 'encargo', fecha: fechaAntes }).eq('id', ventaId));
    listo();
  });
}

export async function cobrar(ventaId, fd) {
  return intentar(async () => {
    const db = await conSesion();
    const monto = numero(fd, 'monto');
    if (!monto) throw new Error('Poné cuánto te pagaron.');
    const { data, error } = await db
      .from('cobros')
      .insert({ venta_id: ventaId, fecha: texto(fd, 'fecha') ?? undefined, monto, medio: texto(fd, 'medio') })
      .select('id')
      .single();
    revisar({ error });
    listo();
    return { cobro: data.id };
  });
}

export async function deshacerCobro(cobro) {
  return intentar(async () => {
    const db = await conSesion();
    revisar(await db.from('cobros').delete().eq('id', cobro));
    listo();
  });
}

// Impresiones

export async function crearImpresion(fd) {
  return intentar(async () => {
    const db = await conSesion();
    const lotes = fd.getAll('lote').map((v) => v.toString());
    const gramos = fd.getAll('gramos').map((v) => aNumero(v.toString()) ?? 0);
    const usos = lotes.map((compra_id, i) => ({ compra_id: compra_id || null, gramos: gramos[i] })).filter((u) => u.gramos > 0);

    // El costo por gramo se guarda ahora: el del lote, o el de Ajustes si no hay lote.
    const ids = [...new Set(usos.map((u) => u.compra_id).filter(Boolean))];
    const { data: compras, error: errorLotes } = ids.length
      ? await db.from('compras').select('id, total, cantidad, gramos_por_unidad').in('id', ids)
      : { data: [] };
    revisar({ error: errorLotes });
    const porLote = Object.fromEntries(compras.map((c) => [c.id, costoPorGramo(c)]));
    const sinLote = usos.some((u) => !u.compra_id) ? await costoGramoDeAjustes(db) : 0;

    const ventaItem = texto(fd, 'venta_item_id');
    // "venta" no se guarda: lo dice venta_item_id. Sin pieza elegida queda en stock.
    const destino = !ventaItem && ['propia', 'regalo', 'prueba'].includes(texto(fd, 'destino')) ? texto(fd, 'destino') : 'stock';
    const propia = destino === 'propia';
    const { data: impresion, error } = await db
      .from('impresiones')
      .insert({
        fecha: texto(fd, 'fecha') ?? undefined,
        pieza: texto(fd, 'pieza'),
        producto_id: texto(fd, 'producto_id'),
        venta_item_id: ventaItem,
        destino,
        para: propia ? texto(fd, 'para') : null,
        valor: propia ? numero(fd, 'valor') : null,
        maquina_id: texto(fd, 'maquina_id'),
        horas: numero(fd, 'horas') ?? 0,
        unidades: numero(fd, 'unidades') ?? 1,
        fallida: Boolean(fd.get('fallida')),
        notas: texto(fd, 'notas'),
      })
      .select()
      .single();
    revisar({ error });
    if (usos.length) {
      const filas = usos.map((u) => ({ ...u, impresion_id: impresion.id, costo_gramo: u.compra_id ? porLote[u.compra_id] ?? sinLote : sinLote }));
      const guardados = await db.from('impresion_filamentos').insert(filas);
      if (guardados.error) {
        await db.from('impresiones').delete().eq('id', impresion.id);
        revisar(guardados);
      }
    }
    listo();
  });
}

export async function asignarItem(impresionId, fd) {
  return intentar(async () => {
    const db = await conSesion();
    revisar(await db.from('impresiones').update({ venta_item_id: texto(fd, 'venta_item_id') }).eq('id', impresionId));
    listo();
  });
}

// Bambu Lab: el historial de impresiones de la nube entra a una bandeja y
// desde ahí cada una pasa a ser una impresión de la app (o se descarta).

// Guarda las tareas sin pisar lo que ya elegiste para cada una (la decisión no se manda).
async function guardarTareas(db, tareas) {
  const { data: antes, error } = await db.from('bambu_impresiones').select('tarea_id');
  revisar({ error });
  const ya = new Set(antes.map((f) => String(f.tarea_id)));
  const filas = tareas.filter((t) => t?.id != null).map(desdeTarea);
  for (let i = 0; i < filas.length; i += 200) {
    revisar(await db.from('bambu_impresiones').upsert(filas.slice(i, i + 200), { onConflict: 'user_id,tarea_id' }));
  }
  const ahora = new Date().toISOString();
  revisar(await db.from('bambu_conexion').update({ ultima_vez: ahora }).not('user_id', 'is', null));
  return { nuevas: filas.filter((f) => !ya.has(String(f.tarea_id))).length, total: filas.length };
}

export async function conectarBambu(fd) {
  return intentar(async () => {
    const token = limpiarToken(fd.get('token'));
    const region = texto(fd, 'region') === 'china' ? 'china' : 'global';
    if (!token) throw new Error('Pegá el token de tu cuenta de Bambu Lab.');
    // Primero se prueba: si Bambu no lo acepta, no se guarda.
    const tareas = await pedirTareas(token, region);
    const db = await conSesion();
    revisar(await db.from('bambu_conexion').upsert({ token, region, vence: venceToken(token) }, { onConflict: 'user_id' }));
    const r = await guardarTareas(db, tareas);
    listo();
    return r;
  });
}

export async function traerBambu() {
  return intentar(async () => {
    const db = await conSesion();
    const { data: conexion, error } = await db.from('bambu_conexion').select('token, region').maybeSingle();
    revisar({ error });
    if (!conexion) throw new Error('Primero conectá tu cuenta de Bambu Lab en Ajustes.');
    const r = await guardarTareas(db, await pedirTareas(conexion.token, conexion.region));
    listo();
    return r;
  });
}

export async function desconectarBambu() {
  return intentar(async () => {
    const db = await conSesion();
    revisar(await db.from('bambu_conexion').delete().not('user_id', 'is', null));
    listo();
  });
}

// El día de la impresión, en hora de Argentina.
const diaDe = (iso) => (iso ? new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }) : undefined);

// Pasa filas de la bandeja a impresiones de la app (con sus gramos por color)
// y las marca como revisadas. Va anotando en `creadas` lo que crea, para que
// quien la llama pueda borrarlo si algo falla después.
async function crearDesdeBambu(db, filas, decision, ventaItem, creadas) {
  const { data: maquinas, error } = await db.from('maquinas').select('id, bambu_id').not('bambu_id', 'is', null);
  revisar({ error });
  const maquinaDe = Object.fromEntries(maquinas.map((m) => [m.bambu_id, m.id]));
  const costoGramo = await costoGramoDeAjustes(db);
  for (const f of filas) {
    const { data: impresion, error } = await db
      .from('impresiones')
      .insert({
        fecha: diaDe(f.fin ?? f.inicio),
        pieza: f.titulo || f.diseno || 'Impresión de Bambu Lab',
        venta_item_id: ventaItem,
        destino: decision === 'prueba' ? 'prueba' : 'stock',
        maquina_id: maquinaDe[f.impresora_id] ?? null,
        horas: Math.round((f.segundos / 3600) * 100) / 100,
        unidades: 1,
        fallida: decision === 'prueba' && fallo(f.estado),
        notas: [f.placa, 'desde Bambu Lab'].filter(Boolean).join(' · '),
      })
      .select('id')
      .single();
    revisar({ error });
    creadas.push(impresion.id);
    // Sin lote elegido: el precio del gramo de Ajustes, como al cargarla a mano sin lote.
    const gramos = gramosPorFilamento(f);
    if (gramos.length) revisar(await db.from('impresion_filamentos').insert(gramos.map((g) => ({ impresion_id: impresion.id, gramos: g, costo_gramo: costoGramo }))));
    revisar(await db.from('bambu_impresiones').update({ decision, impresion_id: impresion.id }).eq('id', f.id));
  }
}

// Clasifica una o varias impresiones de la bandeja. Todo o nada: si algo
// falla, se borra lo que se llegó a crear y vuelven a quedar pendientes.
export async function clasificarBambu(fd) {
  return intentar(async () => {
    const ids = fd.getAll('id').map(String).filter(Boolean);
    const decision = texto(fd, 'decision');
    const ventaItem = texto(fd, 'venta_item_id');
    if (!ids.length) throw new Error('Elegí al menos una impresión.');
    if (!['venta', 'stock', 'prueba', 'ignorar', 'cargada'].includes(decision)) throw new Error('Elegí qué hacer con la impresión.');
    if (decision === 'venta' && !ventaItem) throw new Error('Elegí de qué venta es.');
    const db = await conSesion();
    const { data: filas, error } = await db.from('bambu_impresiones').select('*').in('id', ids).eq('decision', 'pendiente');
    revisar({ error });
    if (!filas.length) throw new Error('Esas impresiones ya estaban revisadas.');

    // "No es del negocio" y "Ya la cargué" (a mano) solo la sacan de la bandeja: no crean nada.
    if (decision === 'ignorar' || decision === 'cargada') {
      revisar(await db.from('bambu_impresiones').update({ decision }).in('id', filas.map((f) => f.id)));
      listo();
      return { ids: filas.map((f) => f.id) };
    }

    const creadas = [];
    try {
      await crearDesdeBambu(db, filas, decision, decision === 'venta' ? ventaItem : null, creadas);
    } catch (e) {
      if (creadas.length) await db.from('impresiones').delete().in('id', creadas);
      await db.from('bambu_impresiones').update({ decision: 'pendiente', impresion_id: null }).in('id', filas.map((f) => f.id));
      throw new Error(`No se guardó nada: ${String(e.message).replace(/\.$/, '')}. Probá de nuevo.`);
    }
    listo();
    return { ids: filas.map((f) => f.id) };
  });
}

// Vuelve impresiones de la bandeja a pendientes y borra las que se habían creado.
export async function deshacerBambu(ids) {
  return intentar(async () => {
    const db = await conSesion();
    const { data: filas, error } = await db.from('bambu_impresiones').select('id, impresion_id').in('id', ids);
    revisar({ error });
    const creadas = filas.map((f) => f.impresion_id).filter(Boolean);
    if (creadas.length) revisar(await db.from('impresiones').delete().in('id', creadas));
    revisar(await db.from('bambu_impresiones').update({ decision: 'pendiente', impresion_id: null }).in('id', ids));
    listo();
  });
}

// Qué máquina de la app es una impresora de Bambu (por su número de serie).
export async function vincularMaquina(impresoraId, fd) {
  return intentar(async () => {
    const db = await conSesion();
    const maquina = texto(fd, 'maquina_id');
    revisar(await db.from('maquinas').update({ bambu_id: null }).eq('bambu_id', impresoraId));
    if (maquina) revisar(await db.from('maquinas').update({ bambu_id: impresoraId }).eq('id', maquina));
    listo();
  });
}

// Capital

export async function moverCapital(fd) {
  return intentar(async () => {
    const db = await conSesion();
    revisar(
      await db.from('capital').insert({
        fecha: texto(fd, 'fecha') ?? undefined,
        tipo: texto(fd, 'tipo'),
        monto: numero(fd, 'monto'),
        nota: texto(fd, 'nota'),
      })
    );
    listo();
  });
}

// Punto de partida

// Contar la caja: lo que hay de verdad contra lo que calcula la app. Lo que
// falta queda como un retiro tuyo (plata del emprendimiento que usaste) o como
// gastado (se fue en algo que no se registró); si sobra, como un aporte. Desde
// ahí la caja de la app es la real.
export async function contarCaja(fd) {
  return intentar(async () => {
    const contado = numero(fd, 'contado');
    if (contado == null || contado < 0) throw new Error('Poné cuánta plata del emprendimiento tenés hoy.');
    const d = await cargar();
    const calculado = Math.round(d.balance.caja * 100) / 100;
    const diferencia = Math.round((contado - calculado) * 100) / 100;
    const fecha = hoy();
    // Lo que falta: o lo usaste para vos (retiro) o se gastó en algo (gasto).
    const faltante = texto(fd, 'faltante') === 'gasto' ? 'gasto' : 'retiro';
    const db = await conSesion();
    let capital = null;
    if (Math.abs(diferencia) >= 1) {
      const { data, error } = await db
        .from('capital')
        .insert({ fecha, tipo: diferencia > 0 ? 'aporte' : faltante, monto: Math.abs(diferencia), nota: 'Diferencia al contar la caja' })
        .select('id')
        .single();
      revisar({ error });
      capital = data.id;
    }
    const { data: conteo, error } = await db.from('conteos_caja').insert({ fecha, contado, calculado, capital_id: capital }).select('id').single();
    if (error) {
      if (capital) await db.from('capital').delete().eq('id', capital);
      revisar({ error });
    }
    // El primer conteo es el punto de partida; después, solo si lo elegís.
    if (!d.ajustes.puntoPartida || fd.get('punto_partida')) {
      revisar(await db.from('ajustes').upsert({ punto_partida: fecha }, { onConflict: 'user_id' }));
    }
    listo();
    return { conteo: conteo.id, diferencia, faltante, puntoAntes: d.ajustes.puntoPartida };
  });
}

// Borra un conteo y el retiro o aporte que había generado. `puntoAntes` es el
// punto de partida que había antes de ese conteo.
export async function deshacerConteo(conteoId, puntoAntes) {
  return intentar(async () => {
    const db = await conSesion();
    const { data: conteo, error } = await db.from('conteos_caja').select('capital_id').eq('id', conteoId).single();
    revisar({ error });
    revisar(await db.from('conteos_caja').delete().eq('id', conteoId));
    if (conteo.capital_id) revisar(await db.from('capital').delete().eq('id', conteo.capital_id));
    revisar(await db.from('ajustes').upsert({ punto_partida: puntoAntes ?? null }, { onConflict: 'user_id' }));
    listo();
  });
}

// El filamento que tenés hoy, por rollo y a precio de hoy. Entra como "ya lo
// tenía": no sale de la caja ni de tu bolsillo. Si lo pedís, los rollos que
// estaban cargados de antes quedan terminados (este inventario los reemplaza).
export async function cargarInventario(fd) {
  return intentar(async () => {
    const columna = (k) => fd.getAll(k).map((v) => v.toString().trim());
    const materiales = columna('material');
    const colores = columna('color');
    const rollos = columna('rollos').map((v) => aNumero(v) ?? 0);
    const gramos = columna('gramos').map((v) => aNumero(v) ?? 1000);
    const precios = columna('precio').map((v) => aNumero(v) ?? 0);
    const fecha = hoy();
    const filas = materiales
      .map((material, i) => ({
        fecha,
        descripcion: `Inventario: ${[material, colores[i]].filter(Boolean).join(' ') || 'filamento'}`,
        categoria: 'filamento',
        forma_pago: 'inicial',
        material: material || null,
        color: colores[i] || null,
        cantidad: rollos[i],
        gramos_por_unidad: Math.round(gramos[i] || 1000),
        total: Math.round(rollos[i] * precios[i] * 100) / 100,
        notas: 'Lo que tenía al empezar a contar',
      }))
      .filter((f) => f.cantidad > 0);
    if (!filas.length) throw new Error('Cargá al menos un rollo con su cantidad.');
    if (filas.some((f) => !f.total)) throw new Error('Poné el precio de hoy de cada rollo: es lo que va a costar reponerlo.');
    const db = await conSesion();
    let agotados = [];
    if (fd.get('agotar')) {
      const { data, error } = await db.from('compras').select('id').eq('categoria', 'filamento').eq('agotado', false);
      revisar({ error });
      agotados = data.map((c) => c.id);
    }
    const { data: nuevas, error } = await db.from('compras').insert(filas).select('id');
    revisar({ error });
    if (agotados.length) {
      const r = await db.from('compras').update({ agotado: true }).in('id', agotados);
      if (r.error) {
        await db.from('compras').delete().in('id', nuevas.map((c) => c.id));
        revisar(r);
      }
    }
    listo();
    return { nuevas: nuevas.map((c) => c.id), agotados };
  });
}

export async function deshacerInventario(nuevas, agotados) {
  return intentar(async () => {
    const db = await conSesion();
    revisar(await db.from('compras').delete().in('id', nuevas));
    if (agotados.length) revisar(await db.from('compras').update({ agotado: false }).in('id', agotados));
    listo();
  });
}

// Ajustes

export async function guardarAjustes(fd) {
  return intentar(async () => {
    const db = await conSesion();
    const {
      data: { user },
    } = await db.auth.getUser();
    revisar(
      await db.from('ajustes').upsert({
        user_id: user.id,
        precio_kwh: numero(fd, 'precio_kwh') ?? 0,
        costo_gramo: numero(fd, 'costo_gramo') ?? 20,
        multiplicador: numero(fd, 'multiplicador') ?? 5,
        multiplicador_mayor: numero(fd, 'multiplicador_mayor') ?? 4,
      })
    );
    listo();
  });
}

// Borrar cualquier fila propia (RLS impide tocar las ajenas).

const BORRABLES = ['maquinas', 'clientes', 'productos', 'compras', 'pagos_cuotas', 'ventas', 'venta_items', 'cobros', 'impresiones', 'capital'];

export async function borrar(tabla, id) {
  return intentar(async () => {
    if (!BORRABLES.includes(tabla)) throw new Error('Tabla no permitida.');
    const db = await conSesion();
    const { error } = await db.from(tabla).delete().eq('id', id);
    if (error?.code === '23503') {
      throw new Error('No se puede borrar: hay impresiones que usan este filamento. Borrá esas impresiones primero o marcá el lote como agotado.');
    }
    revisar({ error });
    listo();
  });
}
