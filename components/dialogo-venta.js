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

const DESCARTAR = '¿Descartar los cambios de esta venta? Lo que cambiaste no se guardó.';

// La carga rápida en una ventana, disponible en toda la app: se abre con el
// botón "+ Venta" o apretando N. En la pestaña Nueva, que ya tiene el
// formulario en pantalla, N y "+ Venta" llevan a ese formulario en vez de abrir
// otro. También sirve para editar una venta: esa edición va en un formulario
// aparte, así no se pierde la venta nueva que estabas cargando.
export default function DialogoVenta(props) {
  const ref = useRef(null);
  const sucio = useRef(false);
  const [abierto, setAbierto] = useState(false);
  const [edicion, setEdicion] = useState(null);

  useEffect(() => {
    // Cerrada queda inerte: si no, el formulario invisible recibe el foco con Tab.
    ref.current.inert = true;
    const abrir = (e) => {
      const editar = e?.type === 'venta:editar';
      const enPagina = document.querySelector('[data-venta-pagina] input[name="item_descripcion"]');
      if (!editar && enPagina) {
        enPagina.focus();
        return;
      }
      sucio.current = false;
      setEdicion(editar ? e.detail : null);
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
    window.addEventListener('keydown', tecla);
    return () => {
      window.removeEventListener('venta:abrir', abrir);
      window.removeEventListener('venta:editar', abrir);
      window.removeEventListener('keydown', tecla);
    };
  }, []);

  // La venta nueva queda como borrador al cerrar; una edición con cambios pregunta antes.
  const puedeCerrar = () => !edicion || !sucio.current || window.confirm(DESCARTAR);
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
        }}
        className="modal modal-bottom sm:modal-middle"
        aria-labelledby="dv-titulo"
      >
        <div className="modal-box flex h-[94dvh] max-h-[94dvh] w-full flex-col p-0 sm:h-[86dvh] sm:max-w-5xl">
          <div className="flex shrink-0 items-center justify-between border-b border-linea px-4 py-2">
            <h2 id="dv-titulo" className="text-lg font-bold">
              {edicion ? `Editar ${edicion.estado === 'encargo' ? 'encargo' : 'venta'}${edicion.cliente ? ` de ${edicion.cliente}` : ''}` : 'Nueva venta'}
            </h2>
            <button type="button" onClick={cerrar} className="btn btn-ghost btn-square h-11 min-h-11 w-11" aria-label="Cerrar">
              <Icono nombre="cerrar" />
            </button>
          </div>
          <div className={`min-h-0 flex-1 ${edicion ? 'hidden' : ''}`}>
            <VentaRapida {...props} borrador enfocar={abierto && !edicion} />
          </div>
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
