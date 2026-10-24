const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const pesosConCentavos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const numero = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });
const porciento = new Intl.NumberFormat('es-AR', { style: 'percent', maximumFractionDigits: 0 });

export const plata = (v) => pesos.format(Math.round(Number(v) || 0));
// Para montos chicos como el costo por gramo.
export const plataFina = (v) => pesosConCentavos.format(Number(v) || 0);
// Para etiquetas chicas de gráficos: $ 193 k, $ 1,2 M.
export function plataCorta(v) {
  const n = Math.round(Number(v) || 0);
  if (Math.abs(n) >= 1e6) return `$ ${numero.format(n / 1e6)} M`;
  if (Math.abs(n) >= 1e3) return `$ ${Math.round(n / 1e3)} k`;
  return plata(n);
}
export const num = (v) => numero.format(Number(v) || 0);
export const pct = (v) => porciento.format(Number(v) || 0);
export const gramos = (v) => `${numero.format(Math.round(Number(v) || 0))} g`;

export function fecha(iso) {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00`);
  const mes = MESES[d.getMonth()].slice(0, 3);
  return d.getFullYear() === Number(hoy().slice(0, 4)) ? `${d.getDate()} ${mes}` : `${d.getDate()} ${mes} ${d.getFullYear()}`;
}

// Días desde una fecha hasta hoy.
export const diasDesde = (iso) => Math.round((new Date(`${hoy()}T12:00:00`) - new Date(`${iso}T12:00:00`)) / 864e5);

// "hoy", "ayer", "hace 5 días", "hace 3 semanas", "hace 2 meses".
export function hace(iso) {
  const d = diasDesde(iso);
  if (d <= 0) return 'hoy';
  if (d === 1) return 'ayer';
  if (d < 14) return `hace ${d} días`;
  if (d < 60) return `hace ${Math.floor(d / 7)} semanas`;
  return `hace ${Math.floor(d / 30)} meses`;
}

// Un link para escribirle por WhatsApp, si el contacto parece un teléfono argentino.
export function whatsapp(contacto, mensaje) {
  const digitos = String(contacto ?? '').replace(/\D/g, '');
  if (digitos.length < 10) return null;
  const tel = digitos.startsWith('54') ? digitos : `549${digitos.replace(/^0/, '')}`;
  return `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`;
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
