'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { costoPorGramo } from '@/lib/calculos';
import { leerNumero } from '@/lib/formato';

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

function revisar({ error }) {
  if (error) throw new Error(error.message);
}

function listo() {
  revalidatePath('/', 'layout');
}

// Cada acción devuelve { error } en vez de lanzarlo: en producción Next
// esconde el mensaje de los errores lanzados y el formulario no podría
// mostrarlo.
async function intentar(trabajo) {
  try {
    await trabajo();
    return { ok: true };
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

// Para buscar por nombre exacto con ilike, sin que % o _ hagan de comodín.
const literal = (s) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

function nombreRepetido(error, que) {
  if (error?.code === '23505') throw new Error(`Ya existe ${que} con ese nombre.`);
  revisar({ error });
}

// Devuelve el id del cliente con ese nombre y lo crea si no existe.
async function clientePorNombre(db, nombre) {
  if (!nombre) return null;
  const { data, error } = await db.from('clientes').select('id').ilike('nombre', literal(nombre)).limit(1);
  revisar({ error });
  if (data.length) return data[0].id;
  const nuevo = await db.from('clientes').insert({ nombre }).select('id').single();
  revisar(nuevo);
  return nuevo.data.id;
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
  return descripciones
    .map((descripcion, i) => ({
      descripcion,
      producto_id: productos[i] || null,
      cantidad: aNumero(cantidades[i]) ?? 1,
      gramos_unidad: aNumero(gramos[i]) ?? 0,
      costo_gramo: costoGramo,
      precio: aNumero(precios[i]) ?? 0,
    }))
    .filter((r) => r.descripcion);
}

export async function crearVenta(fd) {
  return intentar(async () => {
    const db = await conSesion();
    const items = renglones(fd, await costoGramoDeAjustes(db));
    if (!items.length) throw new Error('Agregá al menos una pieza a la venta.');
    const fecha = texto(fd, 'fecha') ?? undefined;
    const { data: venta, error } = await db
      .from('ventas')
      .insert({
        fecha,
        cliente_id: await clientePorNombre(db, texto(fd, 'cliente')),
        estado: texto(fd, 'estado') === 'encargo' ? 'encargo' : 'entregada',
        gastos: numero(fd, 'gastos') ?? 0,
        medio_pago: texto(fd, 'medio_pago'),
        notas: texto(fd, 'notas'),
      })
      .select()
      .single();
    revisar({ error });

    const guardados = await db.from('venta_items').insert(items.map((r) => ({ ...r, venta_id: venta.id })));
    if (guardados.error) {
      await db.from('ventas').delete().eq('id', venta.id);
      revisar(guardados);
    }

    const total = items.reduce((s, r) => s + r.precio, 0);
    const cobrado = fd.get('pago_todo') ? total : numero(fd, 'cobrado');
    if (cobrado) {
      revisar(await db.from('cobros').insert({ venta_id: venta.id, fecha, monto: cobrado, medio: texto(fd, 'medio_pago') }));
    }
    listo();
  });
}

export async function editarVenta(ventaId, fd) {
  return intentar(async () => {
    const db = await conSesion();
    revisar(
      await db
        .from('ventas')
        .update({
          fecha: texto(fd, 'fecha') ?? undefined,
          cliente_id: await clientePorNombre(db, texto(fd, 'cliente')),
          gastos: numero(fd, 'gastos') ?? 0,
          notas: texto(fd, 'notas'),
        })
        .eq('id', ventaId)
    );
    listo();
  });
}

export async function editarItem(itemId, fd) {
  return intentar(async () => {
    const db = await conSesion();
    revisar(
      await db
        .from('venta_items')
        .update({
          cantidad: numero(fd, 'cantidad') ?? 1,
          gramos_unidad: numero(fd, 'gramos_unidad') ?? 0,
          precio: numero(fd, 'precio') ?? 0,
        })
        .eq('id', itemId)
    );
    listo();
  });
}

// Un encargo pasa a venta entregada: la fecha pasa a ser la de entrega y, si
// pagó el resto, se registra el cobro.
export async function entregar(ventaId, fd) {
  return intentar(async () => {
    const db = await conSesion();
    const fecha = texto(fd, 'fecha') ?? undefined;
    revisar(await db.from('ventas').update({ estado: 'entregada', fecha }).eq('id', ventaId));
    const monto = numero(fd, 'monto');
    if (monto) revisar(await db.from('cobros').insert({ venta_id: ventaId, fecha, monto, medio: texto(fd, 'medio') }));
    listo();
  });
}

export async function cobrar(ventaId, fd) {
  return intentar(async () => {
    const db = await conSesion();
    revisar(
      await db.from('cobros').insert({
        venta_id: ventaId,
        fecha: texto(fd, 'fecha') ?? undefined,
        monto: numero(fd, 'monto'),
        medio: texto(fd, 'medio'),
      })
    );
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
        reinversion_pct: numero(fd, 'reinversion_pct') ?? 34,
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
