/** @type {import('next').NextConfig} */
const nextConfig = {
  // Las direcciones de antes de ordenar las secciones en pestañas.
  async redirects() {
    return [
      ['/impresiones', '/taller/impresiones'],
      ['/productos', '/taller/productos'],
      ['/maquinas', '/taller/maquinas'],
      ['/clientes', '/ventas/clientes'],
      ['/caja', '/plata/caja'],
      ['/tu-plata', '/plata'],
    ].map(([source, destination]) => ({ source, destination, permanent: false }));
  },
};

export default nextConfig;
