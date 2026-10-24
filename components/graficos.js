import { plata, plataCorta, pct } from '@/lib/formato';

// Gráficos hechos con HTML y SVG: no cargan nada extra y cada valor está
// escrito al lado, así no dependen solo del color.

const RELLENO = {
  gana: 'stroke-gana',
  acento: 'stroke-acento',
  pierde: 'stroke-pierde',
};

// Anillo de avance (0 a 1) con lo que quieras en el centro.
export function Anillo({ valor, etiqueta, tono = 'gana', tamano = 160, grosor = 14, children }) {
  const v = Math.max(0, Math.min(1, valor || 0));
  const r = (tamano - grosor) / 2;
  const largo = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: tamano, height: tamano }} role="img" aria-label={etiqueta}>
      <svg width={tamano} height={tamano} viewBox={`0 0 ${tamano} ${tamano}`} className="-rotate-90">
        <circle cx={tamano / 2} cy={tamano / 2} r={r} fill="none" strokeWidth={grosor} className="stroke-linea" />
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={r}
          fill="none"
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={`${largo * v} ${largo}`}
          className={`${RELLENO[tono]} transition-[stroke-dasharray] duration-700`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

// Columnas por período. Cada una puede tener una parte resaltada abajo
// (por ejemplo, la ganancia dentro de lo vendido).
export function Columnas({ datos, nombre, nombreParte, etiqueta }) {
  const mayor = Math.max(1, ...datos.map((d) => d.valor));
  return (
    <figure className="relative flex h-full min-h-0 flex-col">
      <div className="flex min-h-40 flex-1 items-end gap-2" role="img" aria-label={etiqueta}>
        {datos.map((d) => (
          <div key={d.etiqueta} className="flex h-full min-w-0 flex-1 flex-col items-center gap-1">
            <div className="relative w-full max-w-14 flex-1">
              <span
                className="absolute inset-x-0 truncate text-center text-[11px] font-semibold"
                style={{ bottom: `calc(${(d.valor / mayor) * 85}% + 2px)` }}
              >
                {d.valor ? plataCorta(d.valor) : ''}
              </span>
              <div
                className="crece-y absolute inset-x-0 bottom-0 flex flex-col justify-end overflow-hidden rounded-t-md bg-acento/25"
                style={{ height: `${(d.valor / mayor) * 85}%`, minHeight: d.valor ? 4 : 0 }}
                title={`${d.etiqueta}: ${plata(d.valor)}${d.parte != null ? ` · ${nombreParte} ${plata(d.parte)}` : ''}`}
              >
                {d.parte > 0 && <div className="w-full bg-acento" style={{ height: `${Math.min(1, d.parte / d.valor) * 100}%` }} />}
              </div>
            </div>
            <span className={`text-xs ${d.actual ? 'font-semibold text-tinta' : 'text-tenue'}`}>{d.etiqueta}</span>
          </div>
        ))}
      </div>
      {nombreParte && (
        <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-tenue">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-acento/25" aria-hidden="true" />
            {nombre}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-acento" aria-hidden="true" />
            {nombreParte}
          </span>
        </figcaption>
      )}
      <div className="sr-only">
        <table>
        <caption>{etiqueta}</caption>
        <tbody>
          {datos.map((d) => (
            <tr key={d.etiqueta}>
              <th>{d.etiqueta}</th>
              <td>{plata(d.valor)}</td>
              {d.parte != null && <td>{plata(d.parte)}</td>}
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </figure>
  );
}

const COLORES = ['bg-gana', 'bg-serie-1', 'bg-serie-2', 'bg-serie-3', 'bg-serie-4'];

// En qué se reparte un total: una barra entera y la lista con % y montos.
export function Reparto({ partes, etiqueta }) {
  const total = partes.reduce((s, p) => s + Math.max(0, p.valor), 0) || 1;
  const visibles = partes.filter((p) => p.valor > 0);
  return (
    <figure>
      <div className="crece-x flex h-4 w-full overflow-hidden rounded-full bg-linea" role="img" aria-label={etiqueta}>
        {visibles.map((p, i) => (
          <div
            key={p.nombre}
            className={`h-full ${p.color ?? COLORES[i % COLORES.length]} ${i ? 'border-l-2 border-hoja' : ''}`}
            style={{ width: `${(p.valor / total) * 100}%` }}
            title={`${p.nombre}: ${pct(p.valor / total)}`}
          />
        ))}
      </div>
      <ul className="mt-3 space-y-1.5 text-sm">
        {visibles.map((p, i) => (
          <li key={p.nombre} className="flex items-center gap-2">
            <span className={`h-3 w-3 shrink-0 rounded-sm ${p.color ?? COLORES[i % COLORES.length]}`} aria-hidden="true" />
            <span className="flex-1">{p.nombre}</span>
            <span className="w-12 text-right font-semibold">{pct(p.valor / total)}</span>
            <span className="w-24 text-right text-tenue">{plata(p.valor)}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

// Los primeros de algo, con barras proporcionales y la parte del total.
export function Ranking({ filas, total }) {
  const mayor = filas[0]?.valor || 1;
  return (
    <ol className="space-y-2.5">
      {filas.map((f) => (
        <li key={f.nombre}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium">
              {f.nombre} {f.nota && <span className="font-normal text-tenue">· {f.nota}</span>}
            </span>
            <span className="shrink-0">
              {plata(f.valor)}
              {total ? <span className="ml-1.5 text-xs text-tenue">{pct(f.valor / total)}</span> : null}
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-linea">
            <div className="crece-x h-full rounded-full bg-acento" style={{ width: `${(f.valor / mayor) * 100}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
