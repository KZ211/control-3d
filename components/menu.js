'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SECCIONES = [
  ['/', 'Panel'],
  ['/ventas', 'Ventas'],
  ['/impresiones', 'Impresiones'],
  ['/clientes', 'Clientes'],
  ['/productos', 'Productos'],
  ['/compras', 'Compras'],
  ['/maquinas', 'Máquinas'],
  ['/caja', 'Caja'],
  ['/tu-plata', 'Tu plata'],
  ['/aprender', 'Aprender'],
  ['/ajustes', 'Ajustes'],
];

export default function Menu() {
  const ruta = usePathname();
  return (
    <nav aria-label="Secciones" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <ul className="flex gap-1 whitespace-nowrap">
        {SECCIONES.map(([href, nombre]) => {
          const actual = href === '/' ? ruta === '/' : ruta.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={actual ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center px-3 text-sm font-medium ${
                  actual ? 'bg-tinta text-papel' : 'text-tenue hover:text-tinta'
                }`}
              >
                {nombre}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
