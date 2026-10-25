-- Conexión con la nube de Bambu Lab: el historial de impresiones llega a una
-- bandeja ("Taller > Por revisar") y desde ahí cada una se pasa a una venta,
-- a stock, a prueba, o se descarta. Correlo una vez en Supabase > SQL Editor.

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
  decision text not null default 'pendiente' check (decision in ('pendiente', 'venta', 'stock', 'prueba', 'ignorar')),
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
