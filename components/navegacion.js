'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { GRUPOS, PORID, grupoDe, pestanaDe } from '@/lib/navegacion';
import { salir } from '@/app/acciones';
import Icono from './iconos';

// Abre la carga rápida de ventas desde cualquier pantalla (la escucha DialogoVenta).
export const abrirVenta = () => window.dispatchEvent(new CustomEvent('venta:abrir'));

export function BotonVenta({ className = '' }) {
  return (
    <button type="button" onClick={abrirVenta} className={`btn btn-primary ${className}`}>
      <Icono nombre="sumar" />
      Venta
    </button>
  );
}

// Menú lateral (desktop).
export function BarraLateral() {
  const ruta = usePathname();
  const actual = grupoDe(ruta).id;
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-linea bg-hoja md:flex">
      <div className="px-5 pb-4 pt-5">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Control <span className="text-primary">3D</span>
        </Link>
      </div>
      <div className="px-3">
        <BotonVenta className="w-full" />
        <p className="mt-1.5 text-center text-xs text-tenue">
          o apretá <kbd className="kbd kbd-xs">N</kbd>
        </p>
      </div>
      <nav aria-label="Secciones" className="mt-4 flex-1 overflow-y-auto px-3">
        <ul className="space-y-0.5">
          {GRUPOS.map((g) => (
            <li key={g.id}>
              <Link
                href={g.href}
                aria-current={actual === g.id ? 'page' : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-btn px-3 text-sm font-medium transition-colors ${
                  actual === g.id ? 'bg-tinta text-papel' : 'text-tenue hover:bg-papel hover:text-tinta'
                } ${g.id === 'aprender' ? 'mt-4' : ''}`}
              >
                <Icono nombre={g.icono} />
                {g.nombre}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <form action={salir} className="border-t border-linea p-3">
        <button className="flex min-h-11 w-full items-center gap-3 rounded-btn px-3 text-sm text-tenue hover:bg-papel hover:text-tinta">
          <Icono nombre="salir" />
          Salir
        </button>
      </form>
    </aside>
  );
}

// Barra de abajo (mobile): cuatro secciones, el botón de venta en el medio y "Más".
export function BarraInferior() {
  const ruta = usePathname();
  const actual = grupoDe(ruta).id;
  const mas = useRef(null);
  const enMas = !['panel', 'ventas', 'plata'].includes(actual);
  // Mientras escribís una venta la barra se esconde: le deja lugar al formulario
  // y al teclado.
  const [cargando, setCargando] = useState(false);
  useEffect(() => {
    const dentro = (el) => Boolean(el?.closest?.('[data-venta-form]'));
    const entra = (e) => setCargando(dentro(e.target));
    const sale = (e) => !dentro(e.relatedTarget) && setCargando(false);
    document.addEventListener('focusin', entra);
    document.addEventListener('focusout', sale);
    return () => {
      document.removeEventListener('focusin', entra);
      document.removeEventListener('focusout', sale);
    };
  }, []);

  const Item = ({ grupo }) => (
    <Link
      href={grupo.href}
      aria-current={actual === grupo.id ? 'page' : undefined}
      className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium ${actual === grupo.id ? 'text-primary' : 'text-tenue'}`}
    >
      <Icono nombre={grupo.icono} />
      {grupo.nombre}
    </Link>
  );

  return (
    <>
      <nav aria-label="Secciones" className={`shrink-0 border-t border-linea bg-hoja pb-[env(safe-area-inset-bottom)] md:hidden ${cargando ? 'hidden' : ''}`}>
        <div className="flex items-stretch">
          <Item grupo={PORID.panel} />
          <Item grupo={PORID.ventas} />
          {/* En la pestaña Nueva el formulario ya está en pantalla con su propio botón de guardar. */}
          {ruta !== '/ventas' && (
            <div className="flex flex-1 items-center justify-center">
              <button type="button" onClick={abrirVenta} aria-label="Cargar una venta" className="btn btn-circle btn-primary shadow-md">
                <Icono nombre="sumar" className="h-6 w-6" />
              </button>
            </div>
          )}
          <Item grupo={PORID.plata} />
          <button
            type="button"
            onClick={() => mas.current?.showModal()}
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium ${enMas ? 'text-primary' : 'text-tenue'}`}
          >
            <Icono nombre="mas" />
            Más
          </button>
        </div>
      </nav>

      <dialog ref={mas} className="modal modal-bottom md:hidden" aria-label="Más secciones">
        <div className="modal-box pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <ul className="grid grid-cols-2 gap-2">
            {['taller', 'compras', 'aprender', 'ajustes'].map((id) => {
              const g = PORID[id];
              return (
                <li key={id}>
                  <Link
                    href={g.href}
                    onClick={() => mas.current?.close()}
                    className={`flex min-h-16 items-center gap-3 rounded-box border px-4 font-medium ${actual === id ? 'border-acento text-primary' : 'border-linea'}`}
                  >
                    <Icono nombre={g.icono} />
                    {g.nombre}
                  </Link>
                </li>
              );
            })}
          </ul>
          <form action={salir} className="mt-3">
            <button className="btn btn-ghost w-full text-tenue">
              <Icono nombre="salir" />
              Salir
            </button>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>Cerrar</button>
        </form>
      </dialog>
    </>
  );
}

// Título de la sección y sus pestañas. `insignias` pone un número al lado de una pestaña.
export function Pestanas({ insignias = {} }) {
  const ruta = usePathname();
  const grupo = grupoDe(ruta);
  const activa = pestanaDe(grupo, ruta);
  const lista = useRef(null);
  // En el celular las pestañas se deslizan: la activa siempre queda a la vista,
  // y un degradé en el borde avisa que hay más para el costado.
  const [hayMas, setHayMas] = useState(false);
  const medir = () => {
    const l = lista.current;
    setHayMas(Boolean(l) && l.scrollLeft + l.clientWidth < l.scrollWidth - 4);
  };
  useEffect(() => {
    lista.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [activa]);
  return (
    <header className="shrink-0 border-b border-linea bg-hoja">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-6 gap-y-1 px-4 pt-3 md:px-6 md:py-3">
        <h1 className="text-lg font-bold tracking-tight md:text-xl">{grupo.nombre}</h1>
        {grupo.pestanas.length > 0 && (
          <nav
            ref={lista}
            onScroll={medir}
            aria-label={`Pestañas de ${grupo.nombre}`}
            className={`sin-barra -mx-4 w-[calc(100%+2rem)] overflow-x-auto px-4 md:mx-0 md:w-auto md:px-0 ${hayMas ? '[mask-image:linear-gradient(to_right,#000_calc(100%_-_3rem),transparent)]' : ''}`}
          >
            <ul className="flex gap-0.5 whitespace-nowrap pb-2 md:gap-1 md:pb-0">
              {grupo.pestanas.map(([href, nombre]) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={activa === href ? 'page' : undefined}
                    className={`inline-flex min-h-11 items-center gap-1 rounded-btn px-2.5 text-sm font-medium transition-colors md:gap-1.5 md:px-3 ${
                      activa === href ? 'bg-tinta text-papel' : 'text-tenue hover:bg-papel hover:text-tinta'
                    }`}
                  >
                    {nombre}
                    {insignias[href] > 0 && (
                      <span className={`badge badge-sm border-0 ${activa === href ? 'bg-papel text-tinta' : 'badge-primary'}`}>{insignias[href]}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
