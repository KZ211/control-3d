// Comparar nombres de clientes como los escribe una persona: sin importar
// mayúsculas, tildes ni espacios de más, y aceptando pequeños errores de tipeo.

export const normalizar = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const junto = (s) => s.replace(/ /g, '');

// Cuántas letras hay que cambiar para pasar de una palabra a la otra.
export function distancia(a, b) {
  if (a === b) return 0;
  let previa = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const fila = [i];
    for (let j = 1; j <= b.length; j++) {
      fila[j] = Math.min(previa[j] + 1, fila[j - 1] + 1, previa[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previa = fila;
  }
  return previa[b.length];
}

// ¿Son probablemente la misma persona? "Luca tech" y "Luk Tech", "Holy cel" y "Marcos holycel".
export function mismoCliente(a, b) {
  const x = junto(normalizar(a));
  const y = junto(normalizar(b));
  if (!x || !y) return false;
  if (x === y) return true;
  const corto = x.length < y.length ? x : y;
  const largo = corto === x ? y : x;
  if (corto.length >= 4 && largo.includes(corto)) return true;
  const tope = corto.length >= 7 ? 2 : corto.length >= 4 ? 1 : 0;
  return distancia(x, y) <= tope;
}

// Los clientes que encajan con lo que se está escribiendo, los más parecidos
// primero. `exacto` es el que tiene el mismo nombre (sin importar tildes).
export function buscarClientes(texto, clientes, cantidad = 4) {
  const t = normalizar(texto);
  if (!t) return { exacto: null, sugeridos: [] };
  const exacto = clientes.find((c) => normalizar(c.nombre) === t) ?? null;
  const puntuados = clientes
    .filter((c) => c !== exacto)
    .map((c) => {
      const n = normalizar(c.nombre);
      const palabras = n.split(' ');
      const puntos = n.startsWith(t) ? 0 : palabras.some((p) => p.startsWith(t)) ? 1 : mismoCliente(t, n) ? 2 : n.includes(t) ? 3 : null;
      return { c, puntos };
    })
    .filter((x) => x.puntos !== null)
    .sort((a, b) => a.puntos - b.puntos || a.c.nombre.localeCompare(b.c.nombre));
  return { exacto, sugeridos: puntuados.slice(0, cantidad).map((x) => x.c) };
}

// Parejas de clientes que parecen la misma persona.
export function posiblesRepetidos(clientes) {
  const parejas = [];
  for (let i = 0; i < clientes.length; i++) {
    for (let j = i + 1; j < clientes.length; j++) {
      if (mismoCliente(clientes[i].nombre, clientes[j].nombre)) parejas.push([clientes[i], clientes[j]]);
    }
  }
  return parejas;
}
