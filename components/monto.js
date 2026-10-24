'use client';

import { leerNumero } from '@/lib/formato';

// Los montos se muestran con puntos de miles ("3.500"), que leerNumero entiende.
const miles = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });
export const conPuntos = (v) => miles.format(v);
const ordenar = (v) => {
  const n = leerNumero(v);
  return n > 0 && Number.isFinite(n) ? conPuntos(n) : v;
};

// Campo de plata: "$" adelante y los miles con punto al salir del campo. Sirve
// controlado (value + alCambiar) o suelto (defaultValue).
export default function Monto({ value, alCambiar, defaultValue, className = '', ...resto }) {
  const controlado = value !== undefined;
  return (
    <span className={`relative block ${className}`}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-tenue" aria-hidden="true">
        $
      </span>
      <input
        inputMode="decimal"
        placeholder="0"
        {...resto}
        {...(controlado ? { value, onChange: (e) => alCambiar(e.target.value) } : { defaultValue: defaultValue ? ordenar(String(defaultValue)) : '' })}
        onBlur={(e) => {
          const bien = ordenar(e.target.value);
          if (bien === e.target.value) return;
          if (controlado) alCambiar(bien);
          else e.target.value = bien;
        }}
        className="entrada bg-hoja pl-7"
      />
    </span>
  );
}
