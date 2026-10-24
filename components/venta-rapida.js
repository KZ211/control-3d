'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Formulario, Enviar } from './formulario';
import Icono from './iconos';
import { crearVenta, editarVenta } from '@/app/acciones';
import { precioSugerido } from '@/lib/calculos';
import { plata, plataFina, num, leerNumero } from '@/lib/formato';
import { buscarClientes } from '@/lib/nombres';
import Monto, { conPuntos } from './monto';

const aNumero = (v) => leerNumero(v) || 0;
const redondear = (v) => Math.round(v / 100) * 100;
const MEDIOS = ['Transferencia', 'Efectivo', 'Mercado Pago', 'Otro'];
const RECIENTES = 6;
const BORRADOR = 'venta:borrador';

function ayer(hoy) {
  const d = new Date(`${hoy}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Lo elegido se marca sólido, como la pestaña activa: se lee de un vistazo qué quedó puesto.
const marcado = (si) => (si ? 'border-tinta bg-tinta font-semibold text-papel hover:border-tinta hover:bg-tinta/90' : 'border-linea bg-hoja font-normal');

// Botones que funcionan como un grupo de opciones.
function Opciones({ nombre, valor, opciones, alCambiar }) {
  return (
    <fieldset>
      <legend className="rotulo mb-1">{nombre}</legend>
      <div className="join w-full">
        {opciones.map(([v, texto]) => (
          <button
            key={v}
            type="button"
            aria-pressed={valor === v}
            onClick={() => alCambiar(v)}
            className={`btn btn-ghost join-item btn-sm min-h-11 flex-1 flex-nowrap gap-1 border px-2 ${marcado(valor === v)}`}
          >
            {valor === v && <Icono nombre="listo" className="h-3.5 w-3.5" />}
            {texto}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const vacia = (l) => !l.descripcion.trim() && !l.gramos && !l.unitario;

// Carga de una venta pensada para hacerse en segundos. Casi todo se vende por
// encargo, así que se arranca describiendo la pieza; el catálogo queda a mano
// para lo que se repite. Después de guardar queda lista para la siguiente.
// Con `borrador`, lo que vas escribiendo se guarda en el navegador: si cambiás
// de pantalla o cerrás la ventana, la venta a medias te espera.
// Con `edicion` es el mismo formulario para corregir una venta ya cargada.
export default function VentaRapida({
  hoy,
  clientes,
  productos,
  costoGramo,
  multiplicador,
  multiplicadorMayor,
  enfocar,
  edicion,
  alListo,
  alCambiarSucio,
  borrador = false,
  delDia,
}) {
  const siguiente = useRef(1);
  // `auto`: el precio sigue al sugerido hasta que lo escribís a mano.
  // `costoUnidad` / `costoGramo`: el costo que ya tiene guardado una pieza al editarla.
  const nueva = (cambio) => ({
    k: siguiente.current++,
    producto: '',
    descripcion: '',
    cantidad: 1,
    gramos: '',
    unitario: '',
    auto: true,
    ...cambio,
  });
  const [lineas, setLineas] = useState(() =>
    edicion
      ? edicion.items.map((it) =>
          nueva({
            id: it.id,
            producto: it.producto_id ?? '',
            descripcion: it.descripcion,
            cantidad: it.cantidad,
            gramos: it.gramos ? String(it.gramos) : '',
            unitario: it.precio ? conPuntos(it.precio / it.cantidad) : '',
            auto: false,
            costoUnidad: it.costoUnidad,
            costoGramo: it.costoGramo,
          })
        )
      : [nueva()]
  );
  const [cliente, setCliente] = useState(edicion?.cliente ?? '');
  const [fecha, setFecha] = useState(edicion?.fecha ?? hoy);
  const [estado, setEstado] = useState(edicion?.estado ?? 'entregada');
  const [cobro, setCobro] = useState('todo');
  const [cobrado, setCobrado] = useState('');
  // Al editar no se inventa un medio: queda el que tenía la venta, o ninguno.
  const [medio, setMedio] = useState(edicion ? (edicion.medio ?? '') : 'Transferencia');
  const [gastos, setGastos] = useState(edicion?.gastos ? String(edicion.gastos) : '');
  const [notas, setNotas] = useState(edicion?.notas ?? '');
  const [diferencia, setDiferencia] = useState(false);
  const [catalogo, setCatalogo] = useState(false);
  const [buscar, setBuscar] = useState('');
  const [guardada, setGuardada] = useState(null);
  const [retomada, setRetomada] = useState(false);
  const [verCuenta, setVerCuenta] = useState(false);
  const [mac, setMac] = useState(false);
  const uid = useId();
  const cuerpo = useRef(null);
  const restaurado = useRef(false);

  const enfocarPieza = (cual = 'first') =>
    requestAnimationFrame(() => {
      const campos = cuerpo.current?.querySelectorAll('input[name="item_descripcion"]');
      (cual === 'last' ? campos?.[campos.length - 1] : campos?.[0])?.focus();
    });

  // Lo que se guarda del borrador (y con lo que se compara una edición).
  const foto = {
    lineas: lineas.map(({ k, ...l }) => l),
    cliente,
    fecha,
    estado,
    cobro,
    cobrado,
    gastos,
    notas,
    diferencia,
  };
  const firma = JSON.stringify(foto);
  const enBlanco = lineas.every(vacia) && !cliente.trim() && !gastos && !notas.trim();

  // El borrador se escribe antes de leerlo: en el primer render todavía no hay nada que guardar.
  useEffect(() => {
    if (!borrador || !restaurado.current) return;
    try {
      if (enBlanco) localStorage.removeItem(BORRADOR);
      else localStorage.setItem(BORRADOR, firma);
    } catch {}
  }, [firma]);

  const restaurar = () => {
    restaurado.current = true;
    let b;
    try {
      b = JSON.parse(localStorage.getItem(BORRADOR) ?? 'null');
    } catch {
      return;
    }
    // Sin borrador guardado es que la venta ya se guardó (o se descartó) en otro lado.
    if (!b?.lineas?.length) {
      if (!enBlanco) empezarDeCero();
      return;
    }
    setLineas(b.lineas.map((l) => nueva(l)));
    setCliente(b.cliente ?? '');
    setFecha(b.fecha || hoy);
    setEstado(b.estado ?? 'entregada');
    setCobro(b.cobro ?? 'todo');
    setCobrado(b.cobrado ?? '');
    setGastos(b.gastos ?? '');
    setNotas(b.notas ?? '');
    setRetomada(true);
  };

  // El medio de pago que usaste la última vez, y la venta que quedó a medias.
  useEffect(() => {
    try {
      const m = localStorage.getItem('venta:medio');
      if (!edicion && MEDIOS.includes(m)) setMedio(m);
    } catch {}
    if (borrador) restaurar();
    setMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));
  }, []);
  // Si seguís la misma venta en otra pestaña del navegador, esta se pone al día
  // en vez de pisarla con lo que tenía.
  useEffect(() => {
    if (!borrador) return;
    const otra = (e) => e.key === BORRADOR && restaurar();
    window.addEventListener('storage', otra);
    return () => window.removeEventListener('storage', otra);
  });
  // En la pestaña Nueva solo se enfoca con mouse y teclado: en el celular
  // abriría el teclado apenas entrás. La ventana relee el borrador al abrirse,
  // por si lo seguiste en la pestaña Nueva.
  useEffect(() => {
    if (!enfocar) return;
    if (borrador && enfocar !== 'auto') restaurar();
    if (enfocar === 'auto' ? window.matchMedia('(pointer: fine)').matches : enfocar) enfocarPieza();
  }, [enfocar]);

  // Una edición avisa si tiene cambios sin guardar, para no perderlos al cerrar.
  const inicial = useRef(firma);
  useEffect(() => {
    alCambiarSucio?.(firma !== inicial.current);
  }, [firma]);

  const sugerido = (gramos, mult) => precioSugerido(aNumero(gramos) * costoGramo, mult);
  const cambiar = (k, cambio) => {
    setGuardada(null);
    setLineas((a) => a.map((l) => (l.k === k ? { ...l, ...cambio } : l)));
  };
  const cambiarGramos = (l, gramos) => {
    const sug = aNumero(gramos) > 0 ? redondear(sugerido(gramos, multiplicador)) : 0;
    cambiar(l.k, l.auto ? { gramos, unitario: sug ? conPuntos(sug) : '' } : { gramos });
  };
  const cantidadDe = (l) => Math.max(1, parseInt(l.cantidad, 10) || 1);
  const quitar = (k) => setLineas((a) => (a.length > 1 ? a.filter((l) => l.k !== k) : [nueva()]));
  const otraPieza = () => {
    setLineas((a) => [...a, nueva()]);
    enfocarPieza('last');
  };
  // Un producto del catálogo ocupa la pieza en blanco, si hay una.
  const elegir = (p) => {
    setGuardada(null);
    const gramos = p.gramos_unidad ? String(p.gramos_unidad) : '';
    const unitario = p.precio_unidad ?? (gramos ? redondear(sugerido(gramos, multiplicador)) : '');
    const datos = {
      producto: p.id,
      descripcion: p.nombre,
      gramos,
      unitario: unitario === '' ? '' : conPuntos(unitario),
      auto: p.precio_unidad == null,
    };
    setLineas((a) => {
      const libre = a.find(vacia);
      return libre ? a.map((l) => (l === libre ? { ...l, ...datos } : l)) : [...a, nueva(datos)];
    });
    setCatalogo(false);
    setBuscar('');
  };

  // El costo se calcula igual que en el detalle de la venta: el de sus
  // impresiones si las tiene, si no los gramos por el precio por gramo guardado.
  const costoDe = (l) => cantidadDe(l) * (l.costoUnidad ?? aNumero(l.gramos) * (l.costoGramo ?? costoGramo));
  const calculo = lineas.map((l) => ({
    costo: costoDe(l),
    total: cantidadDe(l) * aNumero(l.unitario),
  }));
  const total = calculo.reduce((s, c) => s + c.total, 0);
  const costo = calculo.reduce((s, c) => s + c.costo, 0);
  const ganancia = total - aNumero(gastos) - costo;
  // Con impresiones cargadas el costo ya trae la luz y el desgaste.
  const conImpresiones = lineas.some((l) => l.costoUnidad != null);
  const listas = lineas.filter((l) => l.descripcion.trim()).length;
  // Entregada y sin precio es un regalo: no se registra ningún cobro.
  const sinPrecio = listas > 0 && total === 0 && estado === 'entregada';
  const pierde = total > 0 && ganancia < 0;

  // Lo que va a quedar cobrado. Al editar, los cobros ya registrados más la diferencia si la marcás.
  const previo = edicion?.cobrado ?? 0;
  const falta = Math.max(0, total - previo);
  const pagado = edicion ? previo + (diferencia ? falta : 0) : cobro === 'todo' ? total : cobro === 'parte' ? Math.min(aNumero(cobrado), total || Infinity) : 0;
  const debe = Math.max(0, total - pagado);
  const pideMedio = edicion ? previo > 0 || (diferencia && falta > 0) : cobro !== 'nada' && !sinPrecio;

  // Enter pasa al campo siguiente en vez de guardar; Ctrl o ⌘ + Enter guarda.
  const teclas = (e) => {
    if (e.key !== 'Enter' || e.defaultPrevented || e.target.tagName !== 'INPUT') return;
    e.preventDefault();
    if (e.metaKey || e.ctrlKey) {
      if (puedeGuardar) e.currentTarget.requestSubmit();
      return;
    }
    const campos = [...e.currentTarget.querySelectorAll('input:not([type=hidden]):not([disabled]):not([type=checkbox])')];
    campos[campos.indexOf(e.target) + 1]?.focus();
  };

  const filtro = buscar.trim().toLowerCase();
  const coinciden = filtro ? productos.filter((p) => p.nombre.toLowerCase().includes(filtro)) : productos;
  const encontrados = coinciden.slice(0, 8);
  const { exacto, sugeridos } = buscarClientes(cliente, clientes);
  const escrito = cliente.trim();
  // Con un nombre parecido a otro cliente hay que elegir: es ese, o es uno nuevo.
  const [nuevoConfirmado, setNuevoConfirmado] = useState('');
  const dudaCliente = Boolean(escrito) && !exacto && sugeridos.length > 0 && nuevoConfirmado !== escrito;
  const puedeGuardar = listas > 0 && !dudaCliente;

  const empezarDeCero = () => {
    setLineas([nueva()]);
    setCliente('');
    setEstado('entregada');
    setCobro('todo');
    setCobrado('');
    setGastos('');
    setNotas('');
    setCatalogo(false);
    setRetomada(false);
    try {
      localStorage.removeItem(BORRADOR);
    } catch {}
  };

  const terminar = () => {
    if (edicion) return alListo?.(`${escrito || 'Sin cliente'} · ${plata(total)}`);
    setGuardada(`${escrito || 'Sin cliente'} · ${plata(total)}`);
    try {
      localStorage.setItem('venta:medio', medio);
    } catch {}
    // La fecha y el medio quedan: sirve para cargar varias ventas viejas seguidas.
    empezarDeCero();
    enfocarPieza();
  };

  // El resumen de abajo cuenta lo que importa según cómo quedó la venta.
  let resumen;
  if (listas === 0) resumen = 'Escribí qué vendiste para guardar';
  else if (dudaCliente) resumen = `Elegí si «${escrito}» es un cliente que ya tenés`;
  else if (!total) resumen = sinPrecio ? `Regalo · ${listas} pieza${listas === 1 ? '' : 's'}` : `${listas} pieza${listas === 1 ? '' : 's'} · sin precio todavía`;
  else if (estado === 'encargo')
    resumen = !debe ? 'Encargo · ya pagó todo' : pagado ? `Encargo · seña ${plata(pagado)} · falta ${plata(debe)}` : `Encargo · falta cobrar ${plata(debe)}`;
  else if (debe > 0) resumen = `Te va a deber ${plata(debe)}`;
  else resumen = 'Cobrada';
  const detalleGanancia =
    total > 0 && costo > 0
      ? pierde
        ? `perdés ${plata(-ganancia)}`
        : `${estado === 'encargo' || debe > 0 ? 'al cobrar te queda' : 'te queda'} ${plata(ganancia)}`
      : null;

  const clienteYFecha = (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto]">
      <div>
        <label htmlFor={`${uid}-cliente`} className="rotulo">
          Cliente
        </label>
        <input
          id={`${uid}-cliente`}
          name="cliente"
          autoComplete="off"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
          onKeyDown={(e) => {
            // Enter elige el cliente sugerido en vez de guardar la venta.
            if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey && !exacto && sugeridos.length === 1) {
              e.preventDefault();
              setCliente(sugeridos[0].nombre);
            }
          }}
          aria-describedby={`${uid}-cliente-estado`}
          className="entrada mt-1"
          placeholder="Nombre, o tocá uno de abajo"
        />
        <p aria-live="polite" className="sr-only">
          {!escrito
            ? ''
            : exacto
              ? `${exacto.nombre}, ya es cliente`
              : sugeridos.length
                ? `${sugeridos.length} ${sugeridos.length === 1 ? 'cliente parecido' : 'clientes parecidos'}: elegí si es uno de ellos o uno nuevo`
                : 'Se crea como cliente nuevo'}
        </p>
        <div id={`${uid}-cliente-estado`} className="mt-2">
          {!escrito ? (
            <div className="sin-barra -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
              {clientes.slice(0, RECIENTES).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCliente(c.nombre)}
                  className="btn btn-ghost btn-sm min-h-11 shrink-0 rounded-full border border-linea bg-hoja font-normal"
                >
                  {c.nombre}
                </button>
              ))}
            </div>
          ) : exacto ? (
            <p className="flex items-center gap-1.5 text-sm text-gana">
              <Icono nombre="listo" className="h-4 w-4" />
              {exacto.nombre === escrito ? 'Ya es cliente' : `Es ${exacto.nombre}, que ya es cliente`}
            </p>
          ) : (
            <>
              {sugeridos.length > 0 ? (
                <div className={`rounded-box p-3 ${dudaCliente ? 'bg-warning/10' : 'bg-papel'}`}>
                  <p className="text-sm font-medium">{sugeridos.length === 1 ? `¿Es ${sugeridos[0].nombre}?` : '¿Es alguno de estos?'}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {sugeridos.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCliente(c.nombre)}
                        className="btn btn-ghost btn-sm min-h-11 rounded-full border border-linea bg-hoja font-normal"
                      >
                        {sugeridos.length === 1 ? `Sí, ${c.nombre}` : c.nombre}
                      </button>
                    ))}
                    <button
                      type="button"
                      aria-pressed={!dudaCliente}
                      onClick={() => setNuevoConfirmado(escrito)}
                      className={`btn btn-ghost btn-sm min-h-11 rounded-full border ${marcado(!dudaCliente)}`}
                    >
                      No, crear «{escrito}»
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-1.5 text-sm text-tenue">Se crea «{escrito}» como cliente nuevo.</p>
              )}
            </>
          )}
        </div>
      </div>

      <div>
        <label htmlFor={`${uid}-fecha`} className="rotulo">
          Fecha
        </label>
        <div className="mt-1 flex gap-1.5">
          <input id={`${uid}-fecha`} name="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required className="entrada min-w-0 flex-1" />
          {[
            ['Hoy', hoy],
            ['Ayer', ayer(hoy)],
          ].map(([n, v]) => (
            <button key={n} type="button" onClick={() => setFecha(v)} aria-pressed={fecha === v} className={`btn btn-ghost min-h-11 border ${marcado(fecha === v)}`}>
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Formulario
      accion={edicion ? editarVenta.bind(null, edicion.id) : crearVenta}
      alTerminar={terminar}
      limpiar={false}
      onKeyDown={teclas}
      className="flex h-full min-h-0 flex-col"
      claseError="shrink-0 border-t border-pierde/30 bg-pierde/10 px-4 py-2"
    >
      <div ref={cuerpo} data-venta-form className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:overflow-hidden">
        {/* Qué vendiste, a quién y cuándo. En el celular las dos secciones se
            desarman (contents) para que "¿Ya la entregaste?" quede justo debajo
            de las piezas, que es lo que se decide enseguida. */}
        <section aria-labelledby={`${uid}-piezas`} className="contents lg:-mr-2 lg:flex lg:min-h-0 lg:flex-col lg:gap-3 lg:overflow-y-auto lg:pr-2">
          <div className="flex shrink-0 flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id={`${uid}-piezas`} className="rotulo">
                Qué vendiste
              </h2>
              {!edicion && delDia?.cantidad > 0 && (
                <p className="text-xs text-tenue">
                  Hoy: {delDia.cantidad} {delDia.cantidad === 1 ? 'venta' : 'ventas'} · <strong className="text-tinta">{plata(delDia.total)}</strong>
                </p>
              )}
            </div>
            {retomada && !guardada && (
              <p role="status" className="flex flex-wrap items-center justify-between gap-x-3 rounded-box bg-papel px-3 py-1 text-sm">
                <span>Seguís con la venta que dejaste a medias.</span>
                <button type="button" onClick={empezarDeCero} className="btn btn-ghost btn-sm min-h-11 px-2 font-medium underline underline-offset-2">
                  Empezar de cero
                </button>
              </p>
            )}

            <ul className="space-y-2">
              {lineas.map((l, i) => {
                const sug = aNumero(l.gramos) > 0 ? redondear(sugerido(l.gramos, multiplicador)) : 0;
                const mayor = aNumero(l.gramos) > 0 ? redondear(sugerido(l.gramos, multiplicadorMayor)) : 0;
                const precio = aNumero(l.unitario);
                const obligatoria = i === 0 || !vacia(l);
                return (
                  <li key={l.k} className="rounded-box border border-linea bg-papel/60 p-3">
                    <input type="hidden" name="item_id" value={l.id ?? ''} />
                    <input type="hidden" name="item_producto" value={l.producto} />
                    <input type="hidden" name="item_cantidad" value={cantidadDe(l)} />
                    <input type="hidden" name="item_precio" value={calculo[i].total} />
                    <div className="flex items-center gap-2">
                      <input
                        name="item_descripcion"
                        aria-label={`Qué es la pieza ${i + 1}`}
                        value={l.descripcion}
                        onChange={(e) =>
                          cambiar(l.k, {
                            descripcion: e.target.value,
                            producto: '',
                          })
                        }
                        placeholder="Qué es (ej: Stitch articulado)"
                        required={obligatoria}
                        autoComplete="off"
                        className="entrada flex-1 bg-hoja text-lg font-semibold"
                      />
                      {(lineas.length > 1 || !vacia(l)) && (
                        <button
                          type="button"
                          onClick={() => quitar(l.k)}
                          aria-label={`Quitar ${l.descripcion || 'la pieza'}`}
                          className="btn btn-ghost btn-square min-h-11"
                        >
                          <Icono nombre="cerrar" className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-end gap-2">
                      <div role="group" aria-labelledby={`${uid}-cant-${l.k}`}>
                        <span id={`${uid}-cant-${l.k}`} className="mb-1 block text-xs text-tenue">
                          Cantidad
                        </span>
                        <div className="join">
                          <button
                            type="button"
                            onClick={() =>
                              cambiar(l.k, {
                                cantidad: Math.max(1, cantidadDe(l) - 1),
                              })
                            }
                            disabled={cantidadDe(l) <= 1}
                            aria-label="Una menos"
                            className="btn join-item h-11 min-h-11 w-11 border-linea bg-hoja px-0 disabled:border-linea disabled:bg-hoja disabled:text-tenue/40"
                          >
                            <Icono nombre="restar" className="h-4 w-4" />
                          </button>
                          <input
                            inputMode="numeric"
                            aria-label={`Cantidad de ${l.descripcion || 'la pieza'}`}
                            value={l.cantidad}
                            onChange={(e) =>
                              cambiar(l.k, {
                                cantidad: e.target.value.replace(/\D/g, '').slice(0, 4),
                              })
                            }
                            onBlur={() => cambiar(l.k, { cantidad: cantidadDe(l) })}
                            onFocus={(e) => e.target.select()}
                            className="join-item h-11 w-12 border-y border-linea bg-hoja text-center text-sm font-semibold outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={() => cambiar(l.k, { cantidad: cantidadDe(l) + 1 })}
                            aria-label="Una más"
                            className="btn join-item h-11 min-h-11 w-11 border-linea bg-hoja px-0"
                          >
                            <Icono nombre="sumar" className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <label className="w-20">
                        <span className="mb-1 block text-xs text-tenue">Gramos c/u</span>
                        <input
                          name="item_gramos"
                          inputMode="decimal"
                          value={l.gramos}
                          onChange={(e) => cambiarGramos(l, e.target.value)}
                          placeholder="0"
                          className="entrada bg-hoja"
                        />
                      </label>
                      <label className="w-28">
                        <span className="mb-1 block text-xs text-tenue">Precio c/u</span>
                        <Monto value={l.unitario} alCambiar={(v) => cambiar(l.k, { unitario: v, auto: false })} />
                      </label>
                      <p className="ml-auto pb-2.5 text-right">
                        <span className="block text-xs text-tenue">Total</span>
                        {l.descripcion.trim() && !calculo[i].total ? (
                          <span className="text-sm font-medium text-tenue">Sin precio</span>
                        ) : (
                          <span className="font-semibold">{plata(calculo[i].total)}</span>
                        )}
                      </p>
                    </div>
                    {sug > 0 && (
                      <div className="mt-2 text-xs">
                        {/* La cuenta de la planilla, con los números de esta pieza. */}
                        <details className="group text-tenue">
                          <summary className="flex min-h-11 cursor-pointer select-none list-none items-center gap-1 underline-offset-2 hover:underline [&::-webkit-details-marker]:hidden">
                            <Icono nombre="siguiente" className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
                            Filamento {plata(aNumero(l.gramos) * costoGramo)} c/u · ¿de dónde salen estos precios?
                          </summary>
                          <p className="mt-1 max-w-prose leading-relaxed">
                            {num(aNumero(l.gramos))} g × {plataFina(costoGramo)} el gramo = {plata(aNumero(l.gramos) * costoGramo)} de filamento por unidad. El sugerido
                            lo multiplica por {num(multiplicador)} para cubrir la luz, el desgaste, las piezas que salen mal y tu tiempo; el de por mayor, por{' '}
                            {num(multiplicadorMayor)}. Los multiplicadores se cambian en Ajustes.
                          </p>
                        </details>
                        <div className="mt-1 flex gap-1.5">
                          {[
                            ['Sugerido', sug, multiplicador],
                            ['Por mayor', mayor, multiplicadorMayor],
                          ].map(([n, v, x]) => (
                            <button
                              key={n}
                              type="button"
                              aria-pressed={precio === v}
                              onClick={() =>
                                cambiar(l.k, {
                                  unitario: conPuntos(v),
                                  auto: n === 'Sugerido',
                                })
                              }
                              className={`btn btn-ghost btn-sm min-h-11 min-w-0 flex-1 flex-nowrap gap-1 whitespace-nowrap rounded-full border px-2.5 text-xs sm:flex-none sm:px-3 sm:text-sm ${marcado(precio === v)}`}
                            >
                              {n} {plata(v)}
                              <span className={precio === v ? 'text-papel/70' : 'text-tenue'}>×{num(x)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={otraPieza} className="btn btn-ghost min-h-11 border border-dashed border-linea font-medium">
                <Icono nombre="sumar" className="h-4 w-4" /> Otra pieza
              </button>
              {productos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCatalogo((v) => !v)}
                  aria-expanded={catalogo}
                  aria-controls={`${uid}-catalogo`}
                  className={`btn btn-ghost min-h-11 font-medium ${catalogo ? 'bg-papel text-tinta' : 'text-tenue hover:text-tinta'}`}
                >
                  <Icono nombre="buscar" className="h-4 w-4" /> Buscar en el catálogo
                </button>
              )}
            </div>
            {catalogo && (
              <div id={`${uid}-catalogo`} className="rounded-box border border-linea bg-hoja p-3">
                <label className="relative block">
                  <span className="sr-only">Buscar en el catálogo</span>
                  <Icono nombre="buscar" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tenue" />
                  <input
                    autoFocus
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (encontrados[0]) elegir(encontrados[0]);
                      }
                      if (e.key === 'Escape') {
                        e.stopPropagation();
                        e.preventDefault();
                        setCatalogo(false);
                      }
                    }}
                    placeholder="Buscar un modelo que ya hiciste"
                    className="entrada pl-9"
                  />
                </label>
                {encontrados.length === 0 ? (
                  <p className="mt-2 text-sm text-tenue">No hay ninguno con ese nombre. Escribilo como pieza nueva.</p>
                ) : (
                  <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                    {encontrados.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => elegir(p)}
                          className="flex min-h-11 w-full items-center justify-between gap-3 rounded-btn px-3 text-left text-sm hover:bg-papel"
                        >
                          <span className="font-medium">{p.nombre}</span>
                          <span className="shrink-0 text-xs text-tenue">{p.precio_unidad ? plata(p.precio_unidad) : `${p.gramos_unidad} g`}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {coinciden.length > encontrados.length && (
                  <p className="mt-2 text-xs text-tenue">Y {coinciden.length - encontrados.length} más: escribí parte del nombre para encontrarlo.</p>
                )}
              </div>
            )}
          </div>
          <div className="order-2 shrink-0 border-t border-linea pt-4 lg:order-none lg:mt-2">{clienteYFecha}</div>
        </section>

        {/* Entrega y cobro */}
        <section aria-labelledby={`${uid}-cobro`} className="contents lg:flex lg:min-h-0 lg:flex-col lg:gap-4 lg:overflow-y-auto lg:border-l lg:border-linea lg:pl-5">
          <h2 id={`${uid}-cobro`} className="sr-only">
            Entrega y cobro
          </h2>
          <div className="order-1 shrink-0 lg:order-none">
            <Opciones
              nombre="¿Ya la entregaste?"
              valor={estado}
              alCambiar={(v) => {
                setEstado(v);
                if (edicion) return;
                // Un encargo casi siempre arranca con seña; al entregarla, lo normal es que pague todo.
                if (v === 'encargo' && cobro === 'todo') setCobro('parte');
                if (v === 'entregada' && cobro === 'parte' && !cobrado) setCobro('todo');
              }}
              opciones={[
                ['entregada', 'Entregada'],
                ['encargo', 'Encargo'],
              ]}
            />
            <input type="hidden" name="estado" value={estado} />
          </div>

          <div className="order-3 flex shrink-0 flex-col gap-4 lg:order-none">
            {edicion ? (
              <div className="space-y-2 rounded-box bg-papel p-3 text-sm">
                <p>
                  Cobrado <strong>{plata(previo)}</strong>
                  {total > 0 && <> de {plata(total)}</>}.
                </p>
                {falta > 0 && (
                  <>
                    <p className={diferencia ? 'text-tenue' : 'font-medium text-pierde'}>
                      {diferencia ? 'Queda cobrada entera.' : `Va a quedar debiendo ${plata(falta)}.`}
                    </p>
                    <label className="flex min-h-11 cursor-pointer items-center gap-2">
                      <input type="checkbox" checked={diferencia} onChange={(e) => setDiferencia(e.target.checked)} className="checkbox checkbox-sm" />
                      Registrar los {plata(falta)} como cobrados hoy
                    </label>
                    {diferencia && <input type="hidden" name="cobrar_diferencia" value={falta} />}
                  </>
                )}
                {total > 0 && previo > total && (
                  <p className="font-medium text-pierde">Cobraste {plata(previo - total)} de más. Corregí o borrá un cobro desde el detalle de la venta.</p>
                )}
                <p className="text-xs text-tenue">Los cobros anteriores se ven y se borran desde el detalle.</p>
              </div>
            ) : (
              !sinPrecio && (
                <>
                  <Opciones
                    nombre="¿Cuánto pagó?"
                    valor={cobro}
                    alCambiar={setCobro}
                    opciones={[
                      ['todo', 'Pagó todo'],
                      ['parte', estado === 'encargo' ? 'Dejó seña' : 'Una parte'],
                      ['nada', 'No pagó'],
                    ]}
                  />
                  {cobro === 'todo' && <input type="hidden" name="pago_todo" value="on" />}
                  {cobro === 'parte' && (
                    <label className="block text-sm">
                      <span className="flex items-center gap-2">
                        <span className="shrink-0">{estado === 'encargo' ? 'Seña' : 'Cobré'}</span>
                        <Monto name="cobrado" value={cobrado} alCambiar={setCobrado} className="flex-1" aria-label={estado === 'encargo' ? 'Seña' : 'Cuánto cobraste'} />
                        {total > 0 && <span className="shrink-0 text-tenue">de {plata(total)}</span>}
                      </span>
                      {total > 0 && aNumero(cobrado) > 0 && aNumero(cobrado) < total && (
                        <span className="mt-1 block text-xs text-tenue">Te van a quedar debiendo {plata(total - aNumero(cobrado))}.</span>
                      )}
                    </label>
                  )}
                </>
              )
            )}

            {pideMedio && (
              <fieldset>
                <legend className="rotulo mb-1">¿Cómo pagó?</legend>
                <div className="flex flex-wrap gap-1.5">
                  {MEDIOS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={medio === m}
                      onClick={() => setMedio(m)}
                      className={`btn btn-ghost btn-sm min-h-11 rounded-full border ${marcado(medio === m)}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
            {medio && <input type="hidden" name="medio_pago" value={medio} />}

            <details className="text-sm" open={Boolean(edicion?.gastos || edicion?.notas)}>
              <summary className="flex min-h-11 cursor-pointer select-none items-center gap-1.5 font-medium">
                <Icono nombre="sumar" className="h-4 w-4" /> Envío o comisión, y notas
                <span className="font-normal text-tenue">(opcional)</span>
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label>
                  <span className="mb-1 block text-xs text-tenue">Envío o comisión que pagás vos</span>
                  <Monto name="gastos" value={gastos} alCambiar={setGastos} />
                </label>
                <label>
                  <span className="mb-1 block text-xs text-tenue">Notas</span>
                  <input name="notas" value={notas} onChange={(e) => setNotas(e.target.value)} className="entrada" placeholder="Color, diseño…" />
                </label>
              </div>
            </details>
          </div>
        </section>
      </div>

      <footer className="order-last shrink-0 border-t border-linea bg-hoja px-4 py-2 sm:py-3">
        {guardada && (
          <p role="status" className="mb-2 flex items-center gap-2 rounded-btn bg-gana/10 px-3 py-2 text-sm font-medium text-gana">
            <Icono nombre="listo" className="h-4 w-4" /> Guardada: {guardada}. Cargá la siguiente.
          </p>
        )}
        {sinPrecio && (
          <p role="status" className="mb-2 rounded-btn bg-papel px-3 py-2 text-sm">
            Sin precio se guarda como <strong>regalo</strong>: no suma a lo vendido ni a lo cobrado, y el filamento cuenta como gasto. Si te pagaron, poné el precio; si
            todavía no sabés cuánto cobrar, marcala como encargo.
          </p>
        )}
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 leading-tight">
            <span className="block text-xl font-bold sm:text-2xl">{plata(total)}</span>
            <span className="block truncate text-xs font-medium">{resumen}</span>
            {detalleGanancia && (
              <span className={`flex items-center gap-1 text-xs ${pierde ? 'font-semibold text-warning' : 'text-tenue'}`}>
                <span className="truncate">{detalleGanancia}</span>
                <button
                  type="button"
                  onClick={() => setVerCuenta((v) => !v)}
                  aria-expanded={verCuenta}
                  className="relative shrink-0 underline underline-offset-2 after:absolute after:-inset-x-2 after:-inset-y-3 after:content-[''] hover:text-tinta"
                  aria-label="Ver la cuenta de lo que te queda"
                >
                  ¿cómo?
                </button>
              </span>
            )}
            {verCuenta && detalleGanancia && (
              <span className="block text-xs text-tenue">
                {plata(total)} − {conImpresiones ? 'costo de impresión' : 'filamento'} {plata(costo)}
                {aNumero(gastos) > 0 && <> − envío {plata(aNumero(gastos))}</>} = {plata(ganancia)}.
                {!conImpresiones && ' No cuenta luz ni desgaste: se suman cuando cargás la impresión en Taller.'}
              </span>
            )}
          </p>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-tenue lg:inline">
              <kbd className="kbd kbd-xs">{mac ? '⌘' : 'Ctrl'}</kbd> + <kbd className="kbd kbd-xs">Enter</kbd>
            </span>
            {/* Un regalo se guarda con otro botón (tinta y moño), para que no se confunda con una venta normal. */}
            <Enviar className={`btn shrink-0 sm:btn-lg sm:min-w-40 ${sinPrecio ? 'btn-neutral' : 'btn-primary'}`} deshabilitado={!puedeGuardar}>
              {sinPrecio && !edicion && <Icono nombre="regalo" className="h-5 w-5" />}
              {edicion ? 'Guardar cambios' : sinPrecio ? 'Guardar como regalo' : 'Guardar venta'}
            </Enviar>
          </div>
        </div>
      </footer>
    </Formulario>
  );
}
