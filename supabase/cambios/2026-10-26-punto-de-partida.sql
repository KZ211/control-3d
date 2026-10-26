-- Punto de partida: contar la caja de verdad, cargar el filamento que tenés hoy
-- y, desde esa fecha, repartir cada venta entre reponer, cuotas, desgaste y lo
-- que podés sacar. No borra nada del historial. Correlo una vez en Supabase > SQL Editor.

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
