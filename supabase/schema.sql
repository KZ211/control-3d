-- Control 3D: tablas, reglas y seguridad.
-- Correlo una sola vez en Supabase > SQL Editor > New query.
-- Si ya habías corrido una versión anterior, corré antes reset.sql.
--
-- Cada fila guarda a quién pertenece (user_id) y la seguridad por filas (RLS)
-- deja leer y escribir solo las filas propias: aunque alguien tenga la clave
-- pública del proyecto, sin tu usuario no ve nada.
--
-- Cómo se relaciona todo:
--
--   clientes ─┐
--             └─< ventas ─< venta_items >─ productos
--                   │            │
--                   └─< cobros   └─< impresiones >─ maquinas
--                                       │
--                                       └─< impresion_filamentos >─ compras (lotes de filamento)
--
--   compras ─< pagos_cuotas        capital (aportes y retiros)        ajustes

create table public.ajustes (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  -- Precio del kWh de tu factura de luz.
  precio_kwh numeric(10, 2) not null default 0 check (precio_kwh >= 0),
  -- Precio por gramo para lo que no sale de un lote cargado (como en la planilla).
  costo_gramo numeric(10, 2) not null default 20 check (costo_gramo > 0),
  -- Precio sugerido = costo del filamento × multiplicador (la planilla usó ×3, ×4 y ×5).
  multiplicador numeric(5, 2) not null default 5 check (multiplicador >= 1),
  -- Igual, pero para ventas por mayor (más unidades, menos margen por unidad).
  multiplicador_mayor numeric(5, 2) not null default 4 check (multiplicador_mayor >= 1),
  -- Parte de cada venta que se aparta para volver a comprar filamento.
  reinversion_pct numeric(5, 2) not null default 34 check (reinversion_pct between 0 and 100)
);

-- Impresoras. Su precio no se guarda acá: sale de las compras asociadas
-- (la máquina y sus accesorios), así la plata se registra en un solo lugar.
create table public.maquinas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null,
  -- Horas que esperás que dure. Reparte el precio entre las horas de uso.
  vida_util_horas integer not null default 5000 check (vida_util_horas > 0),
  -- Consumo eléctrico promedio mientras imprime.
  consumo_watts integer not null default 150 check (consumo_watts >= 0),
  notas text,
  creado timestamptz not null default now()
);

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null check (btrim(nombre) <> ''),
  contacto text,
  notas text,
  creado timestamptz not null default now()
);

-- Catálogo de piezas que se repiten (portafiguritas, cajitas…). Sirve para
-- cargar ventas más rápido y para ver qué se vende más y cuánto deja.
create table public.productos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null check (btrim(nombre) <> ''),
  gramos_unidad numeric(8, 2) not null default 0 check (gramos_unidad >= 0),
  horas_unidad numeric(6, 2) check (horas_unidad is null or horas_unidad >= 0),
  -- Lo que cobrás normalmente por unidad.
  precio_unidad numeric(12, 2) check (precio_unidad is null or precio_unidad >= 0),
  notas text,
  creado timestamptz not null default now()
);

-- Todo lo que compraste para el emprendimiento. Una compra de filamento es un
-- lote: cantidad de rollos × gramos por rollo, y de ahí sale el costo por gramo.
create table public.compras (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha date not null default current_date,
  descripcion text not null,
  categoria text not null check (categoria in ('maquina', 'accesorio', 'filamento', 'insumo', 'repuesto', 'otro')),
  cantidad numeric(10, 2) not null default 1 check (cantidad > 0),
  total numeric(12, 2) not null check (total >= 0),
  -- bolsillo: plata tuya (capital que querés recuperar).
  -- caja: plata que ya generó el emprendimiento.
  -- cuotas: deuda que se va pagando en pagos_cuotas.
  forma_pago text not null default 'bolsillo' check (forma_pago in ('bolsillo', 'caja', 'cuotas')),
  cuotas integer check (cuotas is null or cuotas > 0),
  maquina_id uuid references public.maquinas (id) on delete set null,
  material text,
  color text,
  gramos_por_unidad integer check (gramos_por_unidad is null or gramos_por_unidad > 0),
  -- Para filamento: el lote ya no tiene stock aunque falten gramos por registrar.
  agotado boolean not null default false,
  proveedor text,
  notas text,
  creado timestamptz not null default now(),
  check (forma_pago <> 'cuotas' or cuotas is not null)
);

-- Cada cuota pagada de una compra en cuotas.
create table public.pagos_cuotas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  compra_id uuid not null references public.compras (id) on delete cascade,
  fecha date not null default current_date,
  monto numeric(12, 2) not null check (monto > 0),
  pagado_con text not null default 'bolsillo' check (pagado_con in ('bolsillo', 'caja')),
  creado timestamptz not null default now()
);

-- Un pedido de un cliente. Lo que se vendió va en venta_items.
create table public.ventas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Fecha de entrega; para un encargo, la del pedido hasta que se entrega.
  fecha date not null default current_date,
  cliente_id uuid references public.clientes (id) on delete set null,
  -- encargo: pedido sin entregar (las señas son un adelanto, todavía no ganancia).
  estado text not null default 'entregada' check (estado in ('encargo', 'entregada')),
  -- Lo que sale de esa venta: envío que pagás vos, descuentos, comisiones.
  gastos numeric(12, 2) not null default 0 check (gastos >= 0),
  medio_pago text,
  notas text,
  creado timestamptz not null default now()
);

-- Cada renglón de una venta: qué pieza, cuántas y cuánto se cobró en total.
-- gramos_unidad y costo_gramo estiman el costo cuando no hay impresiones
-- cargadas para el renglón (como en la planilla); si las hay, manda el costo real.
create table public.venta_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  venta_id uuid not null references public.ventas (id) on delete cascade,
  producto_id uuid references public.productos (id) on delete set null,
  descripcion text not null,
  cantidad numeric(10, 2) not null default 1 check (cantidad > 0),
  gramos_unidad numeric(8, 2) not null default 0 check (gramos_unidad >= 0),
  costo_gramo numeric(10, 2) not null default 0 check (costo_gramo >= 0),
  -- Total cobrado por el renglón (no por unidad).
  precio numeric(12, 2) not null default 0 check (precio >= 0),
  notas text,
  creado timestamptz not null default now()
);

-- Lo que el cliente ya pagó (todo junto o seña + resto).
create table public.cobros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  venta_id uuid not null references public.ventas (id) on delete cascade,
  fecha date not null default current_date,
  monto numeric(12, 2) not null check (monto > 0),
  medio text,
  creado timestamptz not null default now()
);

-- Cada impresión. Si es para una venta, apunta al renglón (venta_item_id);
-- si no, destino dice qué es: stock para vender después, algo para vos o la
-- casa, un regalo o una prueba.
create table public.impresiones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha date not null default current_date,
  pieza text not null,
  producto_id uuid references public.productos (id) on delete set null,
  venta_item_id uuid references public.venta_items (id) on delete set null,
  destino text not null default 'stock' check (destino in ('stock', 'propia', 'regalo', 'prueba')),
  -- Para impresiones propias: para quién y cuánto costaría comprarla hecha.
  para text,
  valor numeric(12, 2) check (valor is null or valor >= 0),
  maquina_id uuid references public.maquinas (id) on delete set null,
  horas numeric(6, 2) not null default 0 check (horas >= 0),
  unidades integer not null default 1 check (unidades > 0),
  fallida boolean not null default false,
  notas text,
  creado timestamptz not null default now()
);

-- Filamento usado en una impresión (varias filas con el AMS). El costo por
-- gramo queda guardado al cargarla, así no cambia si después editás el lote.
-- Sin lote (compra_id vacío) se usa el precio por gramo de Ajustes.
create table public.impresion_filamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  impresion_id uuid not null references public.impresiones (id) on delete cascade,
  compra_id uuid references public.compras (id) on delete restrict,
  gramos numeric(8, 2) not null check (gramos > 0),
  costo_gramo numeric(10, 4) not null check (costo_gramo >= 0),
  creado timestamptz not null default now()
);

-- Plata que ponés en la caja del emprendimiento (aporte) o que sacás para vos
-- (retiro: así recuperás lo que pusiste).
create table public.capital (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha date not null default current_date,
  tipo text not null check (tipo in ('aporte', 'retiro')),
  monto numeric(12, 2) not null check (monto > 0),
  nota text,
  creado timestamptz not null default now()
);

-- Un cliente o producto por nombre (sin importar mayúsculas).
create unique index on public.clientes (user_id, lower(btrim(nombre)));
create unique index on public.productos (user_id, lower(btrim(nombre)));

create index on public.compras (user_id, fecha);
create index on public.pagos_cuotas (compra_id);
create index on public.ventas (user_id, fecha);
create index on public.ventas (cliente_id);
create index on public.venta_items (venta_id);
create index on public.venta_items (producto_id);
create index on public.cobros (venta_id);
create index on public.impresiones (user_id, fecha);
create index on public.impresiones (venta_item_id);
create index on public.impresiones (producto_id);
create index on public.impresion_filamentos (impresion_id);
create index on public.impresion_filamentos (compra_id);

-- Seguridad por filas: cada usuario ve y toca solo lo suyo.
do $$
declare
  tabla text;
begin
  foreach tabla in array array[
    'ajustes', 'maquinas', 'clientes', 'productos', 'compras', 'pagos_cuotas', 'ventas', 'venta_items', 'cobros',
    'impresiones', 'impresion_filamentos', 'capital'
  ] loop
    execute format('alter table public.%I enable row level security', tabla);
    execute format(
      'create policy "solo el dueño" on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      tabla
    );
  end loop;
end $$;

-- Bambu Lab (también en supabase/cambios/2026-10-25-bambu-lab.sql para bases que ya existían).

-- El token de tu cuenta de Bambu. Solo lo lee el servidor de la app.
create table if not exists public.bambu_conexion (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  token text not null,
  region text not null default 'global' check (region in ('global', 'china')),
  vence timestamptz,
  ultima_vez timestamptz,
  creado timestamptz not null default now()
);

-- Una fila por impresión del historial de Bambu, tal como llega. `decision`
-- es lo que elegiste; si pasó a ser una impresión de la app, `impresion_id`.
create table if not exists public.bambu_impresiones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tarea_id bigint not null,
  titulo text,
  diseno text,
  placa text,
  inicio timestamptz,
  fin timestamptz,
  segundos integer not null default 0 check (segundos >= 0),
  gramos numeric(10, 2) not null default 0 check (gramos >= 0),
  filamentos jsonb not null default '[]',
  impresora_id text,
  impresora text,
  modelo text,
  estado integer,
  portada text,
  decision text not null default 'pendiente' check (decision in ('pendiente', 'venta', 'stock', 'prueba', 'ignorar', 'cargada')),
  impresion_id uuid references public.impresiones (id) on delete set null,
  creado timestamptz not null default now(),
  unique (user_id, tarea_id)
);
create index if not exists bambu_impresiones_pendientes on public.bambu_impresiones (user_id, decision, inicio);

-- Qué impresora de Bambu es cada máquina (su número de serie).
alter table public.maquinas add column if not exists bambu_id text;

do $$
declare
  tabla text;
begin
  foreach tabla in array array['bambu_conexion', 'bambu_impresiones'] loop
    execute format('alter table public.%I enable row level security', tabla);
    execute format('drop policy if exists "solo el dueño" on public.%I', tabla);
    execute format(
      'create policy "solo el dueño" on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      tabla
    );
  end loop;
end $$;

-- Punto de partida (también en supabase/cambios/2026-10-26-punto-de-partida.sql).
-- "Ya lo tenía": filamento (u otra cosa) que ya estaba cuando empezaste a contar.
-- No sale ni de la caja ni de tu bolsillo.
alter table public.compras drop constraint if exists compras_forma_pago_check;
alter table public.compras add constraint compras_forma_pago_check check (forma_pago in ('bolsillo', 'caja', 'cuotas', 'inicial'));

-- Desde qué día se reparte cada venta.
alter table public.ajustes add column if not exists punto_partida date;

-- Cada vez que contás la caja: lo que había, lo que decía la app y el movimiento
-- (retiro o aporte) que las iguala.
create table if not exists public.conteos_caja (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha date not null default current_date,
  contado numeric(12, 2) not null check (contado >= 0),
  calculado numeric(12, 2) not null,
  capital_id uuid references public.capital (id) on delete set null,
  creado timestamptz not null default now()
);
create index if not exists conteos_caja_fecha on public.conteos_caja (user_id, fecha);

alter table public.conteos_caja enable row level security;
drop policy if exists "solo el dueño" on public.conteos_caja;
create policy "solo el dueño" on public.conteos_caja for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
