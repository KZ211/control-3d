import Menu from '@/components/menu';
import { salir } from '../acciones';

export default function AppLayout({ children }) {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-linea bg-papel/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2 md:flex-row md:items-center md:gap-6 md:px-8">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold tracking-tight">
              Control <span className="text-acento">3D</span>
            </span>
            <form action={salir} className="md:hidden">
              <button className="min-h-11 text-sm text-tenue hover:text-tinta">Salir</button>
            </form>
          </div>
          <Menu />
          <form action={salir} className="ml-auto hidden md:block">
            <button className="min-h-11 text-sm text-tenue hover:text-tinta">Salir</button>
          </form>
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}
