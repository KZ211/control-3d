// La nube de Bambu Lab. No tiene API pública: esto usa la misma que la app
// Bambu Handy (la documentó la comunidad, por ejemplo github.com/m1guelpf/bambulab-rs),
// así que puede cambiar sin aviso. Solo se llama desde el servidor.

const BASE = { global: 'https://api.bambulab.com', china: 'https://api.bambulab.cn' };

// Lo que se pega puede venir como `token=eyJ…;`, entre comillas o con espacios.
export function limpiarToken(texto) {
  return String(texto ?? '')
    .trim()
    .replace(/^token\s*[=:]\s*/i, '')
    .replace(/^["']|["';]+$/g, '')
    .trim();
}

// Si el token es un JWT, cuándo vence (en ISO); si no, null.
export function venceToken(token) {
  const partes = String(token).split('.');
  if (partes.length !== 3) return null;
  try {
    const json = JSON.parse(Buffer.from(partes[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    return json.exp ? new Date(json.exp * 1000).toISOString() : null;
  } catch {
    return null;
  }
}

// Qué significa el número de estado de una tarea. A confirmar con datos reales:
// lo que no está acá se muestra como "Estado N".
export const ESTADOS = { 1: 'Imprimiendo', 2: 'Terminó', 3: 'Falló o se canceló' };
export const estadoDe = (n) => ESTADOS[n] ?? (n == null ? 'Sin estado' : `Estado ${n}`);
export const fallo = (n) => n === 3;

const numero = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// Una tarea de la API como fila de `bambu_impresiones` (sin decisión: esa no se pisa).
export function desdeTarea(t) {
  return {
    tarea_id: t.id,
    titulo: t.title || null,
    diseno: t.designTitle || null,
    placa: t.plateName || (t.plateIndex ? `Placa ${t.plateIndex}` : null),
    inicio: t.startTime || null,
    fin: t.endTime || null,
    segundos: Math.max(0, Math.round(numero(t.costTime))),
    gramos: Math.max(0, numero(t.weight)),
    filamentos: (t.amsDetailMapping ?? [])
      .map((a) => ({
        tipo: a.filamentType || a.targetFilamentType || null,
        color: a.sourceColor || a.targetColor || null,
        gramos: Math.max(0, numero(a.weight)),
      }))
      .filter((f) => f.gramos > 0),
    impresora_id: t.deviceId || null,
    impresora: t.deviceName || null,
    modelo: t.deviceModel || null,
    estado: t.status ?? null,
    portada: t.cover || null,
  };
}

// Los gramos de una impresión por filamento; sin detalle del AMS, el total en uno.
export function gramosPorFilamento(fila) {
  const lista = (fila.filamentos ?? []).filter((f) => numero(f.gramos) > 0);
  if (lista.length) return lista.map((f) => numero(f.gramos));
  return numero(fila.gramos) > 0 ? [numero(fila.gramos)] : [];
}

// El historial de impresiones de la cuenta (las últimas 500).
export async function pedirTareas(token, region = 'global') {
  const url = `${BASE[region] ?? BASE.global}/v1/user-service/my/tasks?limit=500`;
  let respuesta;
  try {
    respuesta = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  } catch {
    throw new Error('No se pudo conectar con Bambu Lab. Probá de nuevo en un rato.');
  }
  if (respuesta.status === 401 || respuesta.status === 403) {
    throw new Error('Bambu no aceptó el token: venció o está mal copiado. Pegá uno nuevo en Ajustes.');
  }
  if (!respuesta.ok) throw new Error(`Bambu Lab respondió con un error (${respuesta.status}). Probá de nuevo en un rato.`);
  const json = await respuesta.json().catch(() => null);
  if (!json || !Array.isArray(json.hits)) throw new Error('Bambu Lab respondió algo que la app no entiende. Puede que hayan cambiado su API.');
  return json.hits;
}
