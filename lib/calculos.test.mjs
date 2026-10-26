import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { construir, resultado, costoPorGramo, precioSugerido } from './calculos.js';

const dia = '2026-05-23';
const redondo = (v) => Math.round(v * 100) / 100;

// Las compras de la hoja Deuda, como quedan después de datos-iniciales.sql.
const base = {
  ajustes: { precio_kwh: 0, costo_gramo: 20, multiplicador: 5, reinversion_pct: 34 },
  maquinas: [
    { id: 'ender', nombre: 'Ender 3 V2', vida_util_horas: 5000, consumo_watts: 150 },
    { id: 'mini', nombre: 'A1 mini', vida_util_horas: 5000, consumo_watts: 100 },
    { id: 'a1', nombre: 'A1', vida_util_horas: 5000, consumo_watts: 100 },
  ],
  compras: [
    { id: 'c1', fecha: dia, categoria: 'maquina', cantidad: 1, total: 150000, forma_pago: 'bolsillo', maquina_id: 'ender' },
    { id: 'c2', fecha: dia, categoria: 'maquina', cantidad: 1, total: 340000, forma_pago: 'bolsillo', maquina_id: 'mini' },
    { id: 'f1', fecha: dia, categoria: 'filamento', cantidad: 5, total: 90000, forma_pago: 'bolsillo', gramos_por_unidad: 1000 },
    { id: 'c4', fecha: dia, categoria: 'insumo', cantidad: 1, total: 7800, forma_pago: 'bolsillo' },
    { id: 'f2', fecha: dia, categoria: 'filamento', cantidad: 4, total: 74500, forma_pago: 'bolsillo', gramos_por_unidad: 1000 },
    { id: 'f3', fecha: dia, categoria: 'filamento', cantidad: 6, total: 122000, forma_pago: 'bolsillo', gramos_por_unidad: 1000 },
    { id: 'c7', fecha: dia, categoria: 'maquina', cantidad: 1, total: 640000, forma_pago: 'bolsillo', maquina_id: 'a1' },
    { id: 'f4', fecha: dia, categoria: 'filamento', cantidad: 1, total: 98900, forma_pago: 'bolsillo', gramos_por_unidad: 1000 },
    { id: 'ams', fecha: dia, categoria: 'accesorio', cantidad: 1, total: 484433.91, forma_pago: 'cuotas', cuotas: 9, maquina_id: 'a1' },
  ],
};

// La hoja Ventas, agrupada en pedidos igual que en datos-iniciales.sql.
function planilla() {
  const pedidos = JSON.parse(readFileSync(new URL('./planilla.test.json', import.meta.url)));
  const ventas = [];
  const items = [];
  const cobros = [];
  pedidos.forEach(([cliente, estado, renglones], k) => {
    const id = `v${k}`;
    ventas.push({ id, fecha: dia, estado, cliente_id: cliente, gastos: 0 });
    let cobrado = 0;
    renglones.forEach(([descripcion, cantidad, gramos_unidad, costo_gramo, precio, pago], j) => {
      items.push({ id: `${id}-${j}`, venta_id: id, descripcion, cantidad, gramos_unidad, costo_gramo, precio });
      if (pago) cobrado += precio;
    });
    if (cobrado) cobros.push({ id: `k${k}`, venta_id: id, fecha: dia, monto: cobrado });
  });
  const clientes = [...new Set(pedidos.map(([c]) => c))].map((c) => ({ id: c, nombre: c }));
  return { ...base, ventas, items, cobros, clientes };
}

test('equipo a recuperar: las tres impresoras de contado y el AMS en cuotas', () => {
  const d = construir(base);
  assert.equal(d.recuperacion.maquinas.reduce((s, c) => s + c.total, 0), 150000 + 340000 + 640000);
  assert.equal(d.recuperacion.enCuotas.length, 1);
  assert.equal(d.recuperacion.equipos, 1130000 + 484433.91);
});

test('la hoja Ventas: bruto, costo y reinversión', () => {
  const d = construir(planilla());
  const rec = d.recuperacion;
  // Total bruto de la planilla: lo cobrado (suma de redondeos).
  assert.equal(rec.cobrado, 1073100);
  // Total neto de la planilla: redondeos − costo de las piezas.
  assert.equal(redondo(rec.neta), 843831.52);
  // Falta por recuperar: el equipo menos la ganancia neta.
  assert.equal(redondo(rec.falta), redondo(1130000 + 484433.91 - 843831.52));
  // Reinversión = bruto × 34%.
  assert.equal(redondo(d.reinversion.apartar), 364854);
  // El costo real del filamento vendido es la suma de "Precio cantidad de costo".
  const r = resultado(d);
  assert.equal(redondo(r.material), 229268.48);
  // Lean y Holy cel quedaron sin cobrar.
  assert.equal(d.balance.porCobrar, 20000 + 27600);
  assert.equal(r.bruto, 1073100 + 47600);
  // Prima aldana y Zara bebe son encargos.
  assert.equal(d.encargos.length, 2);
  // Los 12.174 g vendidos salen de los rollos más viejos: quedan 16 kg − lo vendido.
  const quedan = d.stock.reduce((s, l) => s + l.quedan, 0);
  assert.equal(redondo(quedan), redondo(16000 - 12173.63));
  assert.equal(d.stock.find((l) => l.id === 'f1').quedan, 0);
});

test('clientes y productos', () => {
  const datos = planilla();
  datos.productos = [{ id: 'pf', nombre: 'Portafiguritas', gramos_unidad: 75, precio_unidad: 3500 }];
  for (const it of datos.items) if (/^porta ?figu/i.test(it.descripcion)) it.producto_id = 'pf';
  const d = construir(datos);
  const pf = d.productos[0];
  assert.equal(pf.unidades, 4 + 2 + 6 + 12 + 4 + 8 + 1 + 4 + 1 + 6);
  assert.equal(pf.costoUnidad, 75 * 20);
  assert.equal(pf.sugerido, 75 * 20 * 5);
  assert.equal(pf.sugeridoMayor, 75 * 20 * 4);
  const maxi = d.clientes.find((c) => c.nombre === 'Maxi');
  assert.equal(maxi.pedidos, 5);
  assert.equal(maxi.comprado, 14000 + 21000 + 42000 + 21000 + 20100);
  const lean = d.clientes.find((c) => c.nombre === 'Lean');
  assert.equal(lean.debe, 20000);
});

test('lo puesto de tu bolsillo excluye el AMS en cuotas', () => {
  const d = construir(base);
  assert.equal(d.bolsillo.aportado, 1973200 - 450000);
  assert.equal(d.balance.cuotas, 484433.91);
  // El AMS se suma al precio de la A1.
  assert.equal(d.maquinas.find((m) => m.id === 'a1').precio, 640000 + 484433.91);
});

test('cuotas pagadas de tu bolsillo suman a lo aportado y bajan la deuda', () => {
  const cuota = { compra_id: 'ams', fecha: dia, monto: 53825.99, pagado_con: 'bolsillo' };
  const d = construir({ ...base, pagos: [{ id: 'p1', ...cuota }, { id: 'p2', ...cuota }] });
  assert.equal(redondo(d.balance.deudas), redondo(484433.91 - 2 * 53825.99));
  assert.equal(d.bolsillo.aportado, 1523200 + 2 * 53825.99);
  const ams = d.compras.find((c) => c.id === 'ams');
  assert.equal(redondo(ams.valorCuota), 53825.99);
  assert.equal(ams.cuotasPagadas, 2);
});

test('una impresión en una venta: material, luz y desgaste reemplazan la estimación', () => {
  const d = construir({
    ...base,
    ajustes: { ...base.ajustes, precio_kwh: 200 },
    ventas: [{ id: 'v1', fecha: '2026-06-02', estado: 'entregada', gastos: 1000 }],
    items: [{ id: 'r1', venta_id: 'v1', descripcion: 'Llaveros', cantidad: 10, gramos_unidad: 50, costo_gramo: 20, precio: 30000 }],
    cobros: [{ id: 'k1', venta_id: 'v1', fecha: '2026-06-02', monto: 10000 }],
    impresiones: [{ id: 'i1', fecha: '2026-06-01', pieza: 'Llaveros', venta_item_id: 'r1', destino: 'stock', maquina_id: 'a1', horas: 5, unidades: 10 }],
    filamentos: [{ id: 'x1', impresion_id: 'i1', compra_id: 'f1', gramos: 100, costo_gramo: 18 }],
  });
  const i = d.impresiones[0];
  const porHora = (640000 + 484433.91) / 5000;
  assert.equal(i.material, 100 * 18);
  assert.equal(i.luz, 5 * 0.1 * 200); // 0,5 kWh a $200
  assert.equal(i.desgaste, 5 * porHora);

  const v = d.ventas[0];
  assert.equal(v.items[0].estimado, false);
  assert.equal(v.costo, 1800 + 100 + 5 * porHora);
  assert.equal(v.saldo, 20000);
  assert.equal(v.ganancia, 30000 - 1000 - v.costo);
  assert.equal(i.venta.id, 'v1');
  // La ganancia neta solo resta el filamento: 10.000 cobrados − 1.800.
  assert.equal(d.recuperacion.neta, 10000 - 1800);
  assert.equal(d.balance.porCobrar, 20000);
  assert.equal(d.stock.find((l) => l.id === 'f1').quedan, 4900);
  assert.equal(d.gramosSueltos.ventas, 0);
  assert.equal(d.bolsillo.caja, 10000 - 1000);
});

test('encargos: la seña entra a la caja pero es una deuda hasta entregar', () => {
  const d = construir({
    ...base,
    ventas: [{ id: 'v1', fecha: '2026-06-02', estado: 'encargo', gastos: 0 }],
    items: [{ id: 'r1', venta_id: 'v1', descripcion: 'Trofeo', cantidad: 1, gramos_unidad: 50, costo_gramo: 20, precio: 8000 }],
    cobros: [{ id: 'k1', venta_id: 'v1', fecha: '2026-06-02', monto: 4000 }],
  });
  assert.equal(d.bolsillo.caja, 4000);
  assert.equal(d.recuperacion.neta, 0);
  assert.equal(d.balance.senas, 4000);
  assert.equal(d.balance.porCobrar, 0);
  assert.equal(resultado(d).bruto, 0);
});

test('impresiones sin venta: el stock es un activo, lo propio es gasto', () => {
  const d = construir({
    ...base,
    impresiones: [
      { id: 'i1', fecha: dia, pieza: 'Portafigu', destino: 'stock', unidades: 4 },
      { id: 'i2', fecha: dia, pieza: 'Soporte libro', destino: 'propia', para: 'Nao', valor: 4500, unidades: 1 },
    ],
    filamentos: [
      { id: 'x1', impresion_id: 'i1', compra_id: 'f1', gramos: 300, costo_gramo: 18 },
      { id: 'x2', impresion_id: 'i2', gramos: 78, costo_gramo: 18 },
    ],
  });
  assert.equal(d.balance.valorPiezas, 300 * 18);
  assert.equal(resultado(d).impresionesSinVenta, 78 * 18);
  assert.equal(d.propias.valor, 4500);
  assert.equal(d.gramosSueltos.impresiones, 78);
});

test('el balance cierra: patrimonio = lo puesto neto + lo ganado', () => {
  const d = construir({
    ...base,
    capital: [{ id: 'r1', fecha: dia, tipo: 'retiro', monto: 1000 }],
    ventas: [{ id: 'v1', fecha: dia, estado: 'entregada', gastos: 0 }],
    items: [{ id: 'r1', venta_id: 'v1', descripcion: 'Trofeo', cantidad: 1, gramos_unidad: 0, costo_gramo: 0, precio: 8000 }],
    cobros: [{ id: 'k1', venta_id: 'v1', fecha: dia, monto: 8000 }],
    impresiones: [{ id: 'i1', fecha: dia, pieza: 'Trofeo', venta_item_id: 'r1', destino: 'stock', maquina_id: 'a1', horas: 2, unidades: 1 }],
    filamentos: [{ id: 'x1', impresion_id: 'i1', compra_id: 'f1', gramos: 50, costo_gramo: 18 }],
  });
  assert.equal(redondo(d.balance.ganado), redondo(resultado(d).ganancia));
});

test('precio y costo por gramo', () => {
  assert.equal(costoPorGramo({ total: 18000, cantidad: 1, gramos_por_unidad: 1000 }), 18);
  assert.equal(precioSugerido(936, 3), 2808); // Cuchillo zanahoria: 52 g × $18 × 3
});

test('punto de partida: lo que queda en la caja para reponer, la cuota y el desgaste', () => {
  const desde = '2026-10-26';
  const d = construir({
    ...base,
    hoy: '2026-11-20',
    ajustes: { ...base.ajustes, punto_partida: desde },
    compras: [
      // El AMS con 7 cuotas por pagar y el filamento que tenía ese día, cargado a precio de hoy (25 $/g).
      ...base.compras.map((c) => ({ ...c, agotado: c.categoria === 'filamento' })),
      { id: 'inv', fecha: desde, categoria: 'filamento', cantidad: 4, total: 100000, forma_pago: 'inicial', gramos_por_unidad: 1000 },
    ],
    pagos: [1, 2].map((k) => ({ id: `q${k}`, compra_id: 'ams', fecha: '2026-09-10', monto: 53825.99, pagado_con: 'bolsillo' })),
    ventas: [
      { id: 'vieja', fecha: '2026-10-01', estado: 'entregada', gastos: 0 },
      { id: 'nueva', fecha: '2026-11-02', estado: 'entregada', gastos: 0 },
    ],
    items: [
      { id: 'i1', venta_id: 'vieja', descripcion: 'Antes del punto', cantidad: 1, gramos_unidad: 100, costo_gramo: 20, precio: 10000 },
      { id: 'i2', venta_id: 'nueva', descripcion: 'Mate', cantidad: 2, gramos_unidad: 100, costo_gramo: 20, precio: 30000 },
    ],
    cobros: [{ id: 'k2', venta_id: 'nueva', fecha: '2026-11-02', monto: 30000 }],
  });
  const p = d.plan;
  // El inventario no sale ni de la caja ni del bolsillo.
  assert.equal(d.bolsillo.aportado, 150000 + 340000 + 90000 + 7800 + 74500 + 122000 + 640000 + 98900 + 2 * 53825.99);
  assert.equal(p.precioGramo, 25);
  // Solo la venta de después del punto de partida: 200 g a precio de hoy.
  assert.equal(p.ventas, 1);
  assert.equal(p.reponer, 200 * 25);
  assert.equal(redondo(p.proximaCuota), 53825.99);
  assert.equal(p.necesario, 5000 + p.fondoDesgaste + p.proximaCuota);
  // En la caja están los 30.000 cobrados: no alcanzan para la cuota.
  assert.equal(p.caja, 30000);
  assert.equal(redondo(p.falta), redondo(p.necesario - 30000));
  assert.equal(p.libre, 0);
});

test('sin punto de partida el plan solo da precios y porcentajes', () => {
  const d = construir({ ...base, hoy: dia });
  assert.equal(d.plan.desde, null);
  assert.equal(d.plan.porcentajes, null);
});

test('gastado baja la caja pero no cuenta como algo que volvió a tu bolsillo', () => {
  const d = construir({
    ...base,
    hoy: dia,
    capital: [
      { id: 'a', fecha: dia, tipo: 'aporte', monto: 10000 },
      { id: 'r', fecha: dia, tipo: 'retiro', monto: 3000 },
      { id: 'g', fecha: dia, tipo: 'gasto', monto: 2000 },
    ],
  });
  assert.equal(d.bolsillo.caja, 5000);
  assert.equal(d.bolsillo.retirado, 3000);
  assert.equal(d.bolsillo.gastado, 2000);
  assert.equal(d.caja.find((m) => m.tipo === 'gasto').concepto, 'Gastado (no fue a tu bolsillo)');
});
