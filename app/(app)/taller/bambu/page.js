import Enlace from '@/components/enlace';
import { cargar, cargarBambu, piezasDeVentas } from '@/lib/datos';
import { Pagina, Vacio } from '@/components/ui';
import { Formulario, Enviar } from '@/components/formulario';
import { Bandeja, BotonTraer, Revisadas } from '@/components/bambu';
import { vincularMaquina } from '@/app/acciones';

export const dynamic = 'force-dynamic';

// La bandeja del historial de Bambu Lab: lo que imprimiste y todavía no
// decidiste si es de una venta, stock, una prueba o algo que no es del negocio.
export default async function PorRevisar() {
  const [d, b] = await Promise.all([cargar(), cargarBambu()]);

  if (b.falta) {
    return (
      <Pagina className="!max-w-3xl">
        <Vacio>
          Para conectar Bambu Lab falta crear sus tablas: corré <strong className="text-tinta">supabase/cambios/2026-10-25-bambu-lab.sql</strong> en Supabase → SQL Editor
          y volvé a esta página.
        </Vacio>
      </Pagina>
    );
  }
  if (!b.conexion && !b.impresiones.length) {
    return (
      <Pagina className="!max-w-3xl">
        <Vacio>
          Conectá tu cuenta de Bambu Lab y tu historial de impresiones aparece acá, para elegir qué va a cada venta.{' '}
          <Enlace href="/ajustes" className="font-medium text-tinta underline underline-offset-2">
            Conectar en Ajustes
          </Enlace>
        </Vacio>
      </Pagina>
    );
  }

  const pendientes = b.impresiones.filter((i) => i.decision === 'pendiente');
  const revisadas = b.impresiones.filter((i) => i.decision !== 'pendiente').slice(0, 50);
  // Las impresoras de Bambu que todavía no se sabe qué máquina son.
  const vinculadas = new Set(d.maquinas.map((m) => m.bambu_id).filter(Boolean));
  const sinVincular = [...new Map(b.impresiones.filter((i) => i.impresora_id && !vinculadas.has(i.impresora_id)).map((i) => [i.impresora_id, i])).values()];

  return (
    <Pagina className="!max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="min-w-0 flex-1 basis-72 text-sm text-tenue">
          <strong className="text-base text-tinta">
            {pendientes.length} {pendientes.length === 1 ? 'impresión' : 'impresiones'} por revisar
          </strong>
          {' · '}lo que marques de una venta, stock o prueba pasa a Impresiones con su costo; lo que no es del negocio no suma nada.
        </p>
        {b.conexion ? (
          <BotonTraer />
        ) : (
          <Enlace href="/ajustes" className="btn btn-ghost min-h-11 border border-linea">
            Volver a conectar
          </Enlace>
        )}
      </div>

      {sinVincular.length > 0 && d.maquinas.length > 0 && (
        <div className="rounded-box bg-papel p-4 text-sm">
          <p className="font-medium">¿Qué máquina es cada impresora?</p>
          <p className="text-xs text-tenue">Así cada impresión suma la luz y el desgaste de la máquina correcta. Se elige una sola vez.</p>
          <ul className="mt-3 space-y-2">
            {sinVincular.map((i) => (
              <li key={i.impresora_id}>
                <Formulario accion={vincularMaquina.bind(null, i.impresora_id)} limpiar={false} className="flex flex-wrap items-end gap-2">
                  <label className="min-w-0 flex-1 basis-56">
                    <span className="mb-1 block text-xs text-tenue">
                      {i.impresora ?? 'Impresora'}
                      {i.modelo ? ` (${i.modelo})` : ''}
                    </span>
                    <select name="maquina_id" required defaultValue="" className="entrada">
                      <option value="" disabled>
                        Elegí la máquina
                      </option>
                      {d.maquinas.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nombre}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Enviar className="btn btn-ghost min-h-11 border border-linea">Es esta</Enviar>
                </Formulario>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pendientes.length === 0 ? (
        <Vacio>No hay nada por revisar. Cuando imprimas algo nuevo, tocá “Traer impresiones”.</Vacio>
      ) : (
        <Bandeja pendientes={pendientes} piezas={piezasDeVentas(d)} />
      )}

      {revisadas.length > 0 && (
        <details className="tarjeta px-4 py-2">
          <summary className="flex min-h-11 cursor-pointer select-none items-center text-sm font-medium">Ya revisadas (las últimas {revisadas.length})</summary>
          <Revisadas filas={revisadas} />
        </details>
      )}
      <p className="text-xs text-tenue">
        El historial sale de la nube de Bambu Lab (lo mismo que ves en Bambu Handy). Las impresiones lanzadas desde la tarjeta SD no aparecen. Los gramos son los que
        informa Bambu y el filamento se costea al precio del gramo de Ajustes.
      </p>
    </Pagina>
  );
}
