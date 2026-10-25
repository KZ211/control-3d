// Las secciones de la app y sus pestañas. Cada pestaña es una página aparte.
export const GRUPOS = [
  {
    id: 'panel',
    nombre: 'Panel',
    icono: 'inicio',
    href: '/',
    pestanas: [
      ['/', 'Resumen'],
      ['/panel/mes', 'Mes'],
      ['/panel/balance', 'Balance'],
    ],
  },
  {
    id: 'ventas',
    nombre: 'Ventas',
    icono: 'ventas',
    href: '/ventas',
    pestanas: [
      ['/ventas', 'Nueva'],
      ['/ventas/encargos', 'Encargos'],
      ['/ventas/cobrar', 'Te deben'],
      ['/ventas/historial', 'Historial'],
      ['/ventas/clientes', 'Clientes'],
    ],
  },
  {
    id: 'taller',
    nombre: 'Taller',
    icono: 'taller',
    href: '/taller',
    pestanas: [
      ['/taller', 'Imprimir'],
      ['/taller/impresiones', 'Impresiones'],
      ['/taller/bambu', 'Por revisar'],
      ['/taller/productos', 'Productos'],
      ['/taller/maquinas', 'Máquinas'],
    ],
  },
  {
    id: 'compras',
    nombre: 'Compras',
    icono: 'compras',
    href: '/compras',
    pestanas: [
      ['/compras', 'Nueva'],
      ['/compras/filamento', 'Filamento'],
      ['/compras/cuotas', 'Cuotas'],
      ['/compras/historial', 'Historial'],
    ],
  },
  {
    id: 'plata',
    nombre: 'Plata',
    icono: 'plata',
    href: '/plata',
    pestanas: [
      ['/plata', 'Recuperación'],
      ['/plata/caja', 'Caja'],
      ['/plata/bolsillo', 'Tu bolsillo'],
      ['/plata/reinversion', 'Reinversión'],
    ],
  },
  { id: 'aprender', nombre: 'Aprender', icono: 'aprender', href: '/aprender', pestanas: [] },
  { id: 'ajustes', nombre: 'Ajustes', icono: 'ajustes', href: '/ajustes', pestanas: [] },
];

export const PORID = Object.fromEntries(GRUPOS.map((g) => [g.id, g]));

const dentro = (ruta, href) => (href === '/' ? ruta === '/' : ruta === href || ruta.startsWith(`${href}/`));

export function grupoDe(ruta) {
  if (ruta === '/' || ruta.startsWith('/panel')) return PORID.panel;
  return GRUPOS.find((g) => g.href !== '/' && dentro(ruta, g.href)) ?? PORID.panel;
}

// La pestaña más específica que contiene la ruta.
export function pestanaDe(grupo, ruta) {
  return grupo.pestanas.reduce((mejor, [href]) => (dentro(ruta, href) && href.length > (mejor?.length ?? -1) ? href : mejor), null);
}
