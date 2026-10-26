// Todos los números de la app salen de acá, a partir de las filas crudas de
// la base. Son funciones puras: no leen la base ni la fecha, así se pueden
// probar (calculos.test.mjs).

const n = (v) => Number(v) || 0;
const sumar = (lista, f) => lista.reduce((total, x) => total + f(x), 0);
const ROLLO_G = 1000;

export const enPeriodo = (fecha, desde, hasta) => (!desde || fecha >= desde) && (!hasta || fecha <= hasta);

function agrupar(lista, clave) {
  const grupos = {};
  for (const x of lista) (grupos[x[clave]] ??= []).push(x);
  return grupos;
}

export function gramosDelLote(compra) {
  return n(compra.cantidad) * (n(compra.gramos_por_unidad) || ROLLO_G);
}

export function costoPorGramo(compra) {
  const gramos = gramosDelLote(compra);
  return gramos ? n(compra.total) / gramos : 0;
}

// Costo de una impresión: material + luz + desgaste de la máquina.
export function costoDeImpresion({ horas, filamentos, maquina, precioKwh }) {
  const material = sumar(filamentos, (f) => n(f.gramos) * n(f.costo_gramo));
  const luz = maquina ? n(horas) * (n(maquina.consumo_watts) / 1000) * n(precioKwh) : 0;
  const desgaste = maquina ? n(horas) * maquina.porHora : 0;
  return { material, luz, desgaste, total: material + luz + desgaste };
}

// Como en la planilla: el costo del filamento multiplicado (×3, ×4, ×5…).
export function precioSugerido(costoMaterial, multiplicador) {
  return n(costoMaterial) * (n(multiplicador) || 1);
}

// Qué es una impresión que no está en una venta.
export const DESTINOS = { stock: 'Stock', propia: 'Para vos', regalo: 'Regalo', prueba: 'Prueba' };

export function construir(datos) {
  const {
    maquinas = [],
    compras = [],
    pagos = [],
    clientes = [],
    productos = [],
    ventas = [],
    items = [],
    cobros = [],
    impresiones = [],
    filamentos = [],
    capital = [],
    conteos = [],
    ajustes,
  } = datos;
  const aj = {
    precioKwh: n(ajustes?.precio_kwh),
    costoGramo: n(ajustes?.costo_gramo) || 20,
    multiplicador: n(ajustes?.multiplicador) || 5,
    multiplicadorMayor: n(ajustes?.multiplicador_mayor) || 4,
    reinversionPct: n(ajustes?.reinversion_pct ?? 34),
    puntoPartida: ajustes?.punto_partida ?? null,
  };

  // Máquinas: el precio es la suma de sus compras (máquina y accesorios).
  const maqs = {};
  for (const m of maquinas) maqs[m.id] = { ...m, precio: 0, porHora: 0, horas: 0, impresiones: 0 };
  for (const c of compras) {
    if (c.maquina_id && maqs[c.maquina_id] && (c.categoria === 'maquina' || c.categoria === 'accesorio')) {
      maqs[c.maquina_id].precio += n(c.total);
    }
  }
  for (const m of Object.values(maqs)) m.porHora = m.precio / (n(m.vida_util_horas) || 1);

  // Lotes de filamento: costo por gramo y gramos usados.
  const lotes = {};
  for (const c of compras) {
    if (c.categoria !== 'filamento') continue;
    // `gramos_ajuste`: lo que corregiste al pesar el rollo (positivo: se usó más de lo registrado).
    lotes[c.id] = { ...c, gramos: gramosDelLote(c), costoGramo: costoPorGramo(c), usados: n(c.gramos_ajuste), usadosSinLote: 0, ajuste: n(c.gramos_ajuste) };
  }
  // Gramos impresos sin lote (los de la planilla, o sin elegir rollo), con su fecha.
  let gramosSinLote = 0;
  const usosSueltos = [];

  // Impresiones con su costo. El costo por gramo es el guardado al cargarla.
  const filsPorImpresion = agrupar(filamentos, 'impresion_id');
  const imps = impresiones.map((i) => {
    const fils = (filsPorImpresion[i.id] ?? []).map((f) => {
      const lote = lotes[f.compra_id];
      if (lote) lote.usados += n(f.gramos);
      else {
        gramosSinLote += n(f.gramos);
        usosSueltos.push({ fecha: i.fecha, creado: i.creado, gramos: n(f.gramos) });
      }
      return { ...f, lote };
    });
    const maquina = maqs[i.maquina_id];
    if (maquina) {
      maquina.horas += n(i.horas);
      maquina.impresiones += 1;
    }
    const costo = costoDeImpresion({ horas: i.horas, filamentos: fils, maquina, precioKwh: aj.precioKwh });
    return {
      ...i,
      filamentos: fils,
      maquina,
      gramos: sumar(fils, (f) => n(f.gramos)),
      ...costo,
      costo: costo.total,
      porUnidad: costo.total / Math.max(1, n(i.unidades)),
    };
  });
  const impsPorItem = agrupar(imps.filter((i) => i.venta_item_id), 'venta_item_id');

  const prods = Object.fromEntries(productos.map((p) => [p.id, p]));
  const clis = Object.fromEntries(clientes.map((c) => [c.id, c]));

  // Renglones de venta: con impresiones cargadas el costo es real; si no, se
  // estima como en la planilla (cantidad × gramos × precio por gramo).
  const its = items.map((it) => {
    const suyas = impsPorItem[it.id] ?? [];
    const real = suyas.length > 0;
    const material = real ? sumar(suyas, (i) => i.material) : n(it.cantidad) * n(it.gramos_unidad) * n(it.costo_gramo);
    const luz = sumar(suyas, (i) => i.luz);
    const desgaste = sumar(suyas, (i) => i.desgaste);
    const costo = material + luz + desgaste;
    return {
      ...it,
      producto: prods[it.producto_id],
      impresiones: suyas,
      estimado: !real,
      gramos: real ? sumar(suyas, (i) => i.gramos) : n(it.cantidad) * n(it.gramos_unidad),
      material,
      luz,
      desgaste,
      costo,
      ganancia: n(it.precio) - costo,
    };
  });
  const itemsPorVenta = agrupar(its, 'venta_id');

  // Los gramos que no salieron de un lote elegido (ventas sin impresiones e
  // impresiones sin lote) se descuentan de los rollos más viejos primero, pero
  // solo de los que ya tenías ese día: lo que se usó antes de comprar (o de
  // cargar como inventario) un rollo no puede salir de ese rollo.
  const fechaVenta = Object.fromEntries(ventas.map((v) => [v.id, v]));
  const estimados = its.filter((r) => r.estimado && r.gramos > 0);
  const gramosEstimados = sumar(estimados, (r) => r.gramos);
  for (const r of estimados) usosSueltos.push({ fecha: fechaVenta[r.venta_id]?.fecha ?? r.creado?.slice(0, 10) ?? '', creado: r.creado, gramos: r.gramos });
  const ordenar = (a, b) => (a.fecha === b.fecha ? String(a.creado ?? '').localeCompare(String(b.creado ?? '')) : String(a.fecha).localeCompare(String(b.fecha)));
  const porAntiguedad = Object.values(lotes)
    .filter((l) => !l.agotado)
    .sort(ordenar);
  // Si el uso y el rollo son del mismo día, cuenta lo que se cargó después del rollo.
  const yaEstaba = (l, u) => l.fecha < u.fecha || (l.fecha === u.fecha && String(l.creado ?? '') <= String(u.creado ?? ''));
  // Lo usado antes del inventario ya está contado en él: no falta ningún rollo.
  const inventario = Object.values(lotes)
    .filter((l) => l.forma_pago === 'inicial')
    .map((l) => l.fecha)
    .sort()[0];
  let sueltos = 0;
  let antesDelInventario = 0;
  for (const u of usosSueltos.sort(ordenar)) {
    let resto = u.gramos;
    for (const l of porAntiguedad) {
      if (resto <= 0) break;
      if (!yaEstaba(l, u)) continue;
      const toma = Math.min(resto, Math.max(0, l.gramos - l.usados));
      l.usadosSinLote += toma;
      l.usados += toma;
      resto -= toma;
    }
    if (inventario && u.fecha < inventario) antesDelInventario += resto;
    else sueltos += resto;
  }

  // Ventas: total, cobrado, saldo, costo y ganancia.
  const cobrosPorVenta = agrupar(cobros, 'venta_id');
  const vts = ventas.map((v) => {
    const renglones = itemsPorVenta[v.id] ?? [];
    const suyos = cobrosPorVenta[v.id] ?? [];
    const total = sumar(renglones, (r) => n(r.precio));
    const cobrado = sumar(suyos, (c) => n(c.monto));
    const material = sumar(renglones, (r) => r.material);
    const luz = sumar(renglones, (r) => r.luz);
    const desgaste = sumar(renglones, (r) => r.desgaste);
    const costo = material + luz + desgaste;
    const neta = total - n(v.gastos);
    const ganancia = neta - costo;
    const cliente = clis[v.cliente_id];
    const detalle = renglones.map((r) => (n(r.cantidad) === 1 ? r.descripcion : `${Number(r.cantidad)} × ${r.descripcion}`)).join(', ');

    return {
      ...v,
      cliente,
      titulo: [cliente?.nombre, detalle].filter(Boolean).join(': ') || 'Venta sin detalle',
      detalle,
      items: renglones,
      cobros: suyos,
      unidades: sumar(renglones, (r) => n(r.cantidad)),
      gramos: sumar(renglones, (r) => r.gramos),
      estimado: renglones.some((r) => r.estimado && n(r.gramos_unidad) > 0),
      sinCosto: renglones.some((r) => r.estimado && n(r.gramos_unidad) === 0),
      total,
      cobrado,
      saldo: total - cobrado,
      material,
      luz,
      desgaste,
      costo,
      neta,
      ganancia,
      margen: total ? ganancia / total : 0,
    };
  });
  const entregadas = vts.filter((v) => v.estado === 'entregada');
  const encargos = vts.filter((v) => v.estado === 'encargo');
  const ventaDeItem = Object.fromEntries(vts.flatMap((v) => v.items.map((r) => [r.id, v])));
  for (const i of imps) {
    i.venta = ventaDeItem[i.venta_item_id];
    i.item = i.venta?.items.find((r) => r.id === i.venta_item_id);
  }

  // Clientes: lo que compraron y lo que deben.
  const ventasPorCliente = agrupar(vts.filter((v) => v.cliente_id), 'cliente_id');
  const clientesConDatos = clientes
    .map((c) => {
      const suyas = ventasPorCliente[c.id] ?? [];
      const hechas = suyas.filter((v) => v.estado === 'entregada');
      return {
        ...c,
        pedidos: hechas.length,
        encargos: suyas.length - hechas.length,
        comprado: sumar(hechas, (v) => v.total),
        ganancia: sumar(hechas, (v) => v.ganancia),
        debe: sumar(hechas, (v) => Math.max(0, v.saldo)),
        ultima: suyas.map((v) => v.fecha).sort().at(-1) ?? null,
      };
    })
    .sort((a, b) => b.comprado - a.comprado || a.nombre.localeCompare(b.nombre));

  // Productos: cuánto se vendió de cada uno y a qué precio conviene venderlo.
  const itemsPorProducto = agrupar(
    its.filter((r) => r.producto_id && ventaDeItem[r.id]?.estado === 'entregada'),
    'producto_id'
  );
  const productosConDatos = productos
    .map((p) => {
      const suyos = itemsPorProducto[p.id] ?? [];
      const unidades = sumar(suyos, (r) => n(r.cantidad));
      const facturado = sumar(suyos, (r) => n(r.precio));
      const costoUnidad = n(p.gramos_unidad) * aj.costoGramo;
      return {
        ...p,
        unidades,
        facturado,
        ganancia: sumar(suyos, (r) => r.ganancia),
        precioPromedio: unidades ? facturado / unidades : 0,
        costoUnidad,
        sugerido: precioSugerido(costoUnidad, aj.multiplicador),
        sugeridoMayor: precioSugerido(costoUnidad, aj.multiplicadorMayor),
      };
    })
    .sort((a, b) => b.facturado - a.facturado || a.nombre.localeCompare(b.nombre));

  // Compras en cuotas: lo pagado y lo que falta.
  const pagosPorCompra = agrupar(pagos, 'compra_id');
  const cmps = compras.map((c) => {
    const suyos = pagosPorCompra[c.id] ?? [];
    const pagado = sumar(suyos, (p) => n(p.monto));
    const enCuotas = c.forma_pago === 'cuotas';
    return {
      ...c,
      pagos: suyos,
      pagado: enCuotas ? pagado : n(c.total),
      debe: enCuotas ? Math.max(0, n(c.total) - pagado) : 0,
      valorCuota: enCuotas && c.cuotas ? n(c.total) / c.cuotas : null,
      cuotasPagadas: suyos.length,
      lote: lotes[c.id],
    };
  });

  const caja = movimientosDeCaja({ ventas: vts, compras: cmps, pagos, capital });
  const cajaHoy = caja.at(-1)?.saldo ?? 0;

  // Tu bolsillo: lo que pusiste vos y lo que ya volvió (retiros y caja).
  const aportado =
    sumar(cmps.filter((c) => c.forma_pago === 'bolsillo'), (c) => n(c.total)) +
    sumar(pagos.filter((p) => p.pagado_con === 'bolsillo'), (p) => n(p.monto)) +
    sumar(capital.filter((m) => m.tipo === 'aporte'), (m) => n(m.monto));
  const retirado = sumar(capital.filter((m) => m.tipo === 'retiro'), (m) => n(m.monto));
  // Lo que salió de la caja sin ir a tu bolsillo.
  const gastado = sumar(capital.filter((m) => m.tipo === 'gasto'), (m) => n(m.monto));

  // Recuperación, como en la planilla: la ganancia neta (lo cobrado menos el
  // filamento de las piezas) contra lo que costó el equipo. El filamento
  // comprado no entra: lo paga el costo de cada pieza.
  const equipos = cmps.filter((c) => c.categoria === 'maquina' || c.categoria === 'accesorio');
  const valorEquipos = sumar(equipos, (c) => n(c.total));
  const neta = gananciaNeta({ entregadas });
  const cobradoTotal = sumar(vts, (v) => v.cobrado);
  const propias = imps.filter((i) => !i.venta_item_id && i.destino === 'propia');

  // Reinversión: la parte de lo cobrado que se aparta para filamento, contra
  // lo que ya se gastó de la caja en compras y cuotas.
  const paraReinvertir = (cobradoTotal * aj.reinversionPct) / 100;
  const reinvertido =
    sumar(cmps.filter((c) => c.forma_pago === 'caja'), (c) => n(c.total)) +
    sumar(pagos.filter((p) => p.pagado_con === 'caja'), (p) => n(p.monto));

  // Balance de hoy.
  const porCobrar = sumar(entregadas, (v) => Math.max(0, v.saldo));
  // Las señas de encargos son plata que ya entró por un trabajo que todavía debés.
  const senas = sumar(encargos, (v) => v.cobrado);
  const stock = Object.values(lotes)
    .filter((l) => !l.agotado)
    .map((l) => ({ ...l, quedan: Math.max(0, l.gramos - l.usados), valor: Math.max(0, l.gramos - l.usados) * l.costoGramo }));
  const valorStock = sumar(stock, (l) => l.valor);
  // Piezas hechas que todavía no se vendieron (o de encargos sin entregar): valen lo que costaron.
  const piezas = imps.filter(
    (i) => !i.fallida && ((!i.venta_item_id && i.destino === 'stock') || i.venta?.estado === 'encargo')
  );
  const valorPiezas = sumar(piezas, (i) => i.costo);
  const valorMaquinas = sumar(Object.values(maqs), (m) => Math.max(0, m.precio - m.horas * m.porHora));
  // Máquinas o accesorios que no están asociados a una impresora: van al costo.
  const otrosEquipos = sumar(
    cmps.filter((c) => (c.categoria === 'maquina' || c.categoria === 'accesorio') && !maqs[c.maquina_id]),
    (c) => n(c.total)
  );
  const cuotas = sumar(cmps, (c) => c.debe);
  const deudas = cuotas + senas;
  const activos = cajaHoy + porCobrar + valorStock + valorPiezas + valorMaquinas + otrosEquipos;
  const patrimonio = activos - deudas;

  return {
    ajustes: aj,
    maquinas: Object.values(maqs),
    lotes: Object.values(lotes),
    // Gramos que no se descontaron de ningún rollo.
    gramosSueltos: { impresiones: gramosSinLote, ventas: gramosEstimados, sinRollo: sueltos, antesDelInventario, inventario: inventario ?? null },
    stock,
    piezas,
    impresiones: imps,
    ventas: vts,
    entregadas,
    encargos,
    items: its,
    clientes: clientesConDatos,
    productos: productosConDatos,
    compras: cmps,
    capital,
    caja,
    bolsillo: { aportado, retirado, gastado, caja: cajaHoy },
    conteos: [...conteos].sort((a, b) => (a.fecha === b.fecha ? String(b.creado ?? '').localeCompare(String(a.creado ?? '')) : b.fecha.localeCompare(a.fecha))),
    plan: planDeCaja({
      desde: aj.puntoPartida,
      hoy: datos.hoy,
      entregadas,
      impresiones: imps,
      compras: cmps,
      capital,
      conteos,
      stock,
      costoGramo: aj.costoGramo,
      caja: cajaHoy,
      porCobrar,
    }),
    recuperacion: {
      // Las máquinas de contado y aparte lo que está en cuotas (el AMS).
      maquinas: equipos.filter((c) => c.forma_pago !== 'cuotas'),
      enCuotas: equipos.filter((c) => c.forma_pago === 'cuotas'),
      equipos: valorEquipos,
      ...neta,
      falta: valorEquipos - neta.neta,
      avance: valorEquipos ? neta.neta / valorEquipos : 0,
      // Lo que sumaría la ganancia neta cuando cobres lo que te deben.
      porCobrar,
    },
    propias: { costo: sumar(propias, (i) => i.costo), valor: sumar(propias, (i) => n(i.valor)), cantidad: propias.length },
    reinversion: { pct: aj.reinversionPct, apartar: paraReinvertir, reinvertido, disponible: paraReinvertir - reinvertido },
    balance: {
      caja: cajaHoy,
      porCobrar,
      valorStock,
      valorPiezas,
      valorMaquinas,
      otrosEquipos,
      activos,
      cuotas,
      senas,
      deudas,
      patrimonio,
      ganado: patrimonio - (aportado - retirado),
    },
  };
}

// Ganancia neta de la planilla: lo cobrado de las ventas entregadas menos el
// filamento de sus piezas. No resta luz, desgaste ni otros gastos.
export function gananciaNeta({ entregadas }, desde, hasta) {
  const ventas = entregadas.filter((v) => enPeriodo(v.fecha, desde, hasta));
  const cobrado = sumar(ventas, (v) => v.cobrado);
  const material = sumar(ventas, (v) => v.material);
  return { cobrado, material, neta: cobrado - material };
}

// Cada entrada y salida de plata de la caja del emprendimiento, en orden, con
// el saldo después de cada una. Lo pagado de tu bolsillo no pasa por la caja.
export function movimientosDeCaja({ ventas, compras, pagos, capital }) {
  const movs = [];
  for (const v of ventas) {
    for (const c of v.cobros) {
      const concepto = v.estado === 'encargo' ? `Seña: ${v.titulo}` : `Cobro: ${v.titulo}`;
      movs.push({ fecha: c.fecha, creado: c.creado, concepto, tipo: 'cobro', monto: n(c.monto) });
    }
    if (n(v.gastos)) movs.push({ fecha: v.fecha, creado: v.creado, concepto: `Gastos de venta: ${v.titulo}`, tipo: 'gasto', monto: -n(v.gastos) });
  }
  for (const c of compras) {
    if (c.forma_pago === 'caja') movs.push({ fecha: c.fecha, creado: c.creado, concepto: `Compra: ${c.descripcion}`, tipo: 'compra', monto: -n(c.total) });
  }
  const porId = Object.fromEntries(compras.map((c) => [c.id, c]));
  for (const p of pagos) {
    if (p.pagado_con === 'caja') {
      movs.push({ fecha: p.fecha, creado: p.creado, concepto: `Cuota: ${porId[p.compra_id]?.descripcion ?? ''}`, tipo: 'cuota', monto: -n(p.monto) });
    }
  }
  for (const m of capital) {
    const aporte = m.tipo === 'aporte';
    const concepto = aporte ? 'Aporte tuyo' : m.tipo === 'gasto' ? 'Gastado (no fue a tu bolsillo)' : 'Retiro para vos';
    movs.push({ fecha: m.fecha, creado: m.creado, concepto, tipo: m.tipo, monto: aporte ? n(m.monto) : -n(m.monto), nota: m.nota });
  }
  movs.sort((a, b) => (a.fecha === b.fecha ? String(a.creado ?? '').localeCompare(String(b.creado ?? '')) : a.fecha.localeCompare(b.fecha)));
  let saldo = 0;
  for (const m of movs) {
    saldo += m.monto;
    m.saldo = saldo;
  }
  return movs;
}

// El plan de la caja desde el punto de partida: lo que tiene que quedar para
// reponer el filamento que se usó (a precio de hoy), pagar la próxima cuota y
// cubrir el desgaste de las máquinas; lo que sobra se puede sacar.
export function planDeCaja({ desde, hoy, entregadas, impresiones, compras, capital, conteos = [], stock, costoGramo, caja, porCobrar = 0 }) {
  // Precio de hoy del gramo: el promedio del filamento que tenés (el inventario
  // se carga a precio de hoy); sin stock, el de Ajustes.
  const gramosStock = sumar(stock, (l) => l.quedan);
  const precioGramo = gramosStock ? sumar(stock, (l) => l.valor) / gramosStock : costoGramo;
  // Desgaste por gramo, de las impresiones que lo tienen calculado.
  const conDesgaste = impresiones.filter((i) => n(i.gramos) > 0 && n(i.desgaste) > 0);
  const desgasteGramo = sumar(conDesgaste, (i) => n(i.gramos)) ? sumar(conDesgaste, (i) => n(i.desgaste)) / sumar(conDesgaste, (i) => n(i.gramos)) : 0;
  const reservaDe = (v) => ({
    reponer: n(v.gramos) * precioGramo,
    desgaste: n(v.desgaste) > 0 ? n(v.desgaste) : n(v.gramos) * desgasteGramo,
  });

  // Cuotas: la próxima de cada compra que todavía se debe.
  const enCuotas = compras.filter((c) => c.forma_pago === 'cuotas' && n(c.debe) > 0);
  const proximaCuota = sumar(enCuotas, (c) => Math.min(n(c.valorCuota), n(c.debe)));
  const cuotasRestantes = sumar(enCuotas, (c) => n(c.debe));

  // Qué parte de cada venta es cada cosa, con las ventas de los últimos 90 días.
  const dia = hoy ?? new Date().toISOString().slice(0, 10);
  const hace90 = new Date(new Date(`${dia}T12:00:00`) - 90 * 864e5).toISOString().slice(0, 10);
  const recientes = entregadas.filter((v) => v.fecha >= hace90 && v.fecha <= dia);
  const vendido90 = sumar(recientes, (v) => v.total);
  let porcentajes = null;
  if (vendido90 > 0) {
    const reponer = sumar(recientes, (v) => reservaDe(v).reponer) / vendido90;
    const desgaste = sumar(recientes, (v) => reservaDe(v).desgaste) / vendido90;
    // La cuota es por mes: contra lo que vendés en un mes promedio.
    const cuotas = proximaCuota / (vendido90 / 3);
    porcentajes = { reponer, desgaste, cuotas, libre: 1 - reponer - desgaste - cuotas, vendidoPorMes: vendido90 / 3 };
  }

  if (!desde) return { desde: null, precioGramo, desgasteGramo, proximaCuota, cuotasRestantes, porcentajes };

  const ventas = entregadas.filter((v) => v.fecha >= desde);
  const usado = sumar(ventas, (v) => reservaDe(v).reponer);
  const desgaste = sumar(ventas, (v) => reservaDe(v).desgaste);
  const conCaja = compras.filter((c) => c.forma_pago === 'caja' && c.fecha >= desde);
  const repuesto = sumar(conCaja.filter((c) => c.categoria === 'filamento'), (c) => n(c.total));
  const arreglos = sumar(conCaja.filter((c) => ['maquina', 'accesorio', 'repuesto'].includes(c.categoria)), (c) => n(c.total));
  const reponer = Math.max(0, usado - repuesto);
  const fondoDesgaste = Math.max(0, desgaste - arreglos);
  const necesario = reponer + fondoDesgaste + proximaCuota;
  // Lo que sacaste para vos desde el punto de partida (sin contar los ajustes al contar la caja).
  const deConteos = new Set(conteos.map((c) => c.capital_id).filter(Boolean));
  const sacaste = sumar(capital.filter((m) => m.tipo === 'retiro' && m.fecha >= desde && !deConteos.has(m.id)), (m) => n(m.monto));

  return {
    desde,
    precioGramo,
    desgasteGramo,
    proximaCuota,
    cuotasRestantes,
    porcentajes,
    ventas: ventas.length,
    vendido: sumar(ventas, (v) => v.total),
    cobrado: sumar(ventas, (v) => v.cobrado),
    gramos: sumar(ventas, (v) => n(v.gramos)),
    usado,
    repuesto,
    reponer,
    desgaste,
    arreglos,
    fondoDesgaste,
    necesario,
    caja,
    falta: Math.max(0, necesario - caja),
    libre: Math.max(0, caja - necesario),
    porCobrar,
    sacaste,
  };
}

// Estado de resultados de un período: lo que vendiste (y entregaste) menos lo
// que te costó. Las piezas en stock no son gasto hasta que se venden.
export function resultado(datos, desde, hasta) {
  const ventas = datos.entregadas.filter((v) => enPeriodo(v.fecha, desde, hasta));
  const sinVenta = datos.impresiones.filter(
    (i) => !i.venta_item_id && (i.destino !== 'stock' || i.fallida) && enPeriodo(i.fecha, desde, hasta)
  );
  const otrosGastos = datos.compras.filter(
    (c) => ['insumo', 'repuesto', 'otro'].includes(c.categoria) && enPeriodo(c.fecha, desde, hasta)
  );
  const bruto = sumar(ventas, (v) => v.total);
  const gastosVenta = sumar(ventas, (v) => n(v.gastos));
  const neto = bruto - gastosVenta;
  const material = sumar(ventas, (v) => v.material);
  const luz = sumar(ventas, (v) => v.luz);
  const desgaste = sumar(ventas, (v) => v.desgaste);
  const impresionesSinVenta = sumar(sinVenta, (i) => i.costo);
  const otros = sumar(otrosGastos, (c) => n(c.total));
  const ganancia = neto - material - luz - desgaste - impresionesSinVenta - otros;
  return {
    cantidad: ventas.length,
    unidades: sumar(ventas, (v) => v.unidades),
    bruto,
    gastosVenta,
    neto,
    material,
    luz,
    desgaste,
    impresionesSinVenta,
    otros,
    ganancia,
    margen: bruto ? ganancia / bruto : 0,
    gramos: sumar(ventas, (v) => v.gramos) + sumar(sinVenta, (i) => i.gramos),
  };
}
