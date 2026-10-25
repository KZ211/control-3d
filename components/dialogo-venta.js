'use client';

import { useEffect, useRef, useState } from 'react';
import VentaRapida from './venta-rapida';
import Icono from './iconos';
import { avisar } from './avisos';

// Abre la ventana con una venta ya cargada para corregirla.
export const editarEnVentana = (edicion) => window.dispatchEvent(new CustomEvent('venta:editar', { detail: edicion }));

export function BotonEditar({ edicion, children, className = 'boton-suave min-h-11' }) {
  return (
    <button type="button" onClick={() => editarEnVentana(edicion)} className={className}>
      {children}
    </button>
  );
}

// Abre la ventana con una venta nueva armada a partir de varias impresiones.
// `impresiones`: [{ id, titulo, gramos, costo? }]; el costo viene solo de las del
// taller (las de Bambu se costean por gramos al guardarse).
export function armarVenta(origen, impresiones) {
  const titulos = [...new Set(impresiones.map((i) => i.titulo || 'Sin nombre'))];
  const junto = titulos.join(' + ');
  const descripcion = junto.length <= 60 ? junto : `${titulos[0]} y ${titulos.length - 1} más`;
  const costo = impresiones.every((i) => i.costo != null) ? impresiones.reduce((s, i) => s + i.costo, 0) : null;
  const combo = { origen, ids: impresiones.map((i) => i.id), titulos, descripcion, gramos: impresiones.reduce((s, i) => s + (Number(i.gramos) || 0), 0), costo };
  window.dispatchEvent(new CustomEvent('venta:combo', { detail: combo }));
}

const DESCARTAR = '¿Descartar los cambios de esta venta? Lo que cambiaste no se guardó.';

// La carga rápida en una ventana, disponible en toda la app: se abre con el
// botón "+ Venta" o apretando N. En la pestaña Nueva, que ya tiene el
// formulario en pantalla, N y "+ Venta" llevan a ese formulario en vez de abrir
// otro. También sirve para editar una venta o para armar una con varias
// impresiones: eso va en un formulario aparte, así no se pierde la venta nueva
// que estabas cargando.
export default function DialogoVenta(props) {
  const ref = useRef(null);
  const sucio = useRef(false);
  const [abierto, setAbierto] = useState(false);
  const [edicion, setEdicion] = useState(null);
  const [combo, setCombo] = useState(null);
  const aparte = edicion || combo;

  useEffect(() => {
    // Cerrada queda inerte: si no, el formulario invisible recibe el foco con Tab.
    ref.current.inert = true;
    const abrir = (e) => {
      const editar = e?.type === 'venta:editar';
      const armar = e?.type === 'venta:combo';
      const enPagina = document.querySelector('[data-venta-pagina] input[name="item_descripcion"]');
      if (!editar && !armar && enPagina) {
        enPagina.focus();
        return;
      }
      sucio.current = false;
      setEdicion(editar ? e.detail : null);
      setCombo(armar ? e.detail : null);
      ref.current.inert = false;
      ref.current?.showModal();
      setAbierto(true);
    };
    const tecla = (e) => {
      const escribiendo = e.target.closest?.('input, textarea, select, [contenteditable]');
      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey && !escribiendo && !ref.current?.open) {
        e.preventDefault();
        abrir();
      }
    };
    window.addEventListener('venta:abrir', abrir);
    window.addEventListener('venta:editar', abrir);
    window.addEventListener('venta:combo', abrir);
    window.addEventListener('keydown', tecla);
    return () => {
      window.removeEventListener('venta:abrir', abrir);
      window.removeEventListener('venta:editar', abrir);
      window.removeEventListener('venta:combo', abrir);
      window.removeEventListener('keydown', tecla);
    };
  }, []);

  // La venta nueva queda como borrador al cerrar; una edición (o una venta armada) con cambios pregunta antes.
  const puedeCerrar = () => !aparte || !sucio.current || window.confirm(DESCARTAR);
  const cerrar = () => puedeCerrar() && ref.current?.close();

  return (
    <>
      <dialog
        ref={ref}
        onCancel={(e) => {
          if (!puedeCerrar()) e.preventDefault();
        }}
        onClose={() => {
          ref.current.inert = true;
          setAbierto(false);
          setEdicion(null);
          setCombo(null);
        }}
        className="modal modal-bottom sm:modal-middle"
        aria-labelledby="dv-titulo"
      >
        <div className="modal-box flex h-[94dvh] max-h-[94dvh] w-full flex-col p-0 sm:h-[86dvh] sm:max-w-5xl">
          <div className="flex shrink-0 items-center justify-between border-b border-linea px-4 py-2">
            <h2 id="dv-titulo" className="text-lg font-bold">
              {edicion
                ? `Editar ${edicion.estado === 'encargo' ? 'encargo' : 'venta'}${edicion.cliente ? ` de ${edicion.cliente}` : ''}`
                : combo
                  ? `Nueva venta con ${combo.ids.length} ${combo.ids.length === 1 ? 'impresión' : 'impresiones'}`
                  : 'Nueva venta'}
            </h2>
            <button type="button" onClick={cerrar} className="btn btn-ghost btn-square h-11 min-h-11 w-11" aria-label="Cerrar">
              <Icono nombre="cerrar" />
            </button>
          </div>
          <div className={`min-h-0 flex-1 ${aparte ? 'hidden' : ''}`}>
            <VentaRapida {...props} borrador enfocar={abierto && !aparte} />
          </div>
          {combo && (
            <div className="min-h-0 flex-1">
              <VentaRapida
                key={combo.ids.join()}
                {...props}
                combo={combo}
                enfocar={abierto}
                alCambiarSucio={(v) => (sucio.current = v)}
                alListo={(resumen) => {
                  sucio.current = false;
                  avisar({ texto: `Venta guardada: ${resumen}` });
                  ref.current?.close();
                }}
              />
            </div>
          )}
          {edicion && (
            <div className="min-h-0 flex-1">
              <VentaRapida
                key={edicion.id}
                {...props}
                edicion={edicion}
                enfocar={abierto}
                alCambiarSucio={(v) => (sucio.current = v)}
                alListo={(resumen) => {
                  sucio.current = false;
                  avisar({ texto: `Cambios guardados: ${resumen}` });
                  ref.current?.close();
                }}
              />
            </div>
          )}
        </div>
        <div className="modal-backdrop">
          <button type="button" onClick={cerrar} tabIndex={-1}>
            Cerrar
          </button>
        </div>
      </dialog>
    </>
  );
}
