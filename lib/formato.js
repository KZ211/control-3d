const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const pesosConCentavos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const numero = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });
const porciento = new Intl.NumberFormat('es-AR', { style: 'percent', maximumFractionDigits: 0 });

export const plata = (v) => pesos.format(Math.round(Number(v) || 0));
// Para montos chicos como el costo por gramo.
export const plataFina = (v) => pesosConCentavos.format(Number(v) || 0);
export const num = (v) => numero.format(Number(v) || 0);
export const pct = (v) => porciento.format(Number(v) || 0);
export const gramos = (v) => `${numero.format(Math.round(Number(v) || 0))} g`;

export function fecha(iso) {
  if (!iso) return '';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' });
}

// Fecha de hoy en Buenos Aires, como YYYY-MM-DD.
export const hoy = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function nombreMes(mes) {
  const [anio, m] = mes.split('-').map(Number);
  return `${MESES[m - 1]} ${anio}`;
}

export function moverMes(mes, delta) {
  const [anio, m] = mes.split('-').map(Number);
  const d = new Date(anio, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Lee lo que se escribe en un campo: "$ 1.500,5" → 1500.5, "24.5" → 24.5,
// vacío → null. Si no es un número devuelve NaN.
export function leerNumero(v) {
  const limpio = String(v ?? '')
    .replace(/\$|\s/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');
  return limpio === '' ? null : Number(limpio);
}
