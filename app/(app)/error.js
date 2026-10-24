'use client';

export default function Error({ error, reset }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-bold">Algo salió mal</h1>
      <p className="mt-3 text-tenue">{error?.message || 'No se pudieron cargar los datos.'}</p>
      <button onClick={reset} className="boton mt-6">
        Probar de nuevo
      </button>
    </div>
  );
}
