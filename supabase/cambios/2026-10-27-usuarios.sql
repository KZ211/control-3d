-- Varios usuarios (specs/usuarios.md): ninguna fila puede apuntar a datos de
-- otra cuenta (USR-4) y cada cuenta tiene un tope de filas (USR-5, USR-6).
-- Se puede correr más de una vez. Correlo una vez en Supabase > SQL Editor.

-- USR-4: los argumentos del trigger van de a pares (columna, tabla a la que
-- apunta). Corre con los permisos de quien guarda: si la fila apuntada es de
-- otra cuenta, la seguridad por filas la esconde y no se encuentra.
create or replace function public.solo_lo_mio() returns trigger
language plpgsql
set search_path = ''
as $$
declare
  i integer := 0;
  ref uuid;
  dueno uuid;
begin
  while i < tg_nargs loop
    ref := (to_jsonb(new) ->> tg_argv[i])::uuid;
    if ref is not null then
      dueno := null;
      execute format('select user_id from public.%I where id = $1', tg_argv[i + 1]) into dueno using ref;
      if dueno is distinct from new.user_id then
        raise exception 'Eso no es tuyo.' using hint = 'Una fila apunta a datos de otra cuenta.';
      end if;
    end if;
    i := i + 2;
  end loop;
  return new;
end $$;

drop trigger if exists solo_lo_mio on public.compras;
create trigger solo_lo_mio before insert or update of maquina_id on public.compras
  for each row execute function public.solo_lo_mio('maquina_id', 'maquinas');
drop trigger if exists solo_lo_mio on public.pagos_cuotas;
create trigger solo_lo_mio before insert or update of compra_id on public.pagos_cuotas
  for each row execute function public.solo_lo_mio('compra_id', 'compras');
drop trigger if exists solo_lo_mio on public.ventas;
create trigger solo_lo_mio before insert or update of cliente_id on public.ventas
  for each row execute function public.solo_lo_mio('cliente_id', 'clientes');
drop trigger if exists solo_lo_mio on public.venta_items;
create trigger solo_lo_mio before insert or update of venta_id, producto_id on public.venta_items
  for each row execute function public.solo_lo_mio('venta_id', 'ventas', 'producto_id', 'productos');
drop trigger if exists solo_lo_mio on public.cobros;
create trigger solo_lo_mio before insert or update of venta_id on public.cobros
  for each row execute function public.solo_lo_mio('venta_id', 'ventas');
drop trigger if exists solo_lo_mio on public.impresiones;
create trigger solo_lo_mio before insert or update of producto_id, venta_item_id, maquina_id on public.impresiones
  for each row execute function public.solo_lo_mio('producto_id', 'productos', 'venta_item_id', 'venta_items', 'maquina_id', 'maquinas');
drop trigger if exists solo_lo_mio on public.impresion_filamentos;
create trigger solo_lo_mio before insert or update of impresion_id, compra_id on public.impresion_filamentos
  for each row execute function public.solo_lo_mio('impresion_id', 'impresiones', 'compra_id', 'compras');
drop trigger if exists solo_lo_mio on public.bambu_impresiones;
create trigger solo_lo_mio before insert or update of impresion_id on public.bambu_impresiones
  for each row execute function public.solo_lo_mio('impresion_id', 'impresiones');
drop trigger if exists solo_lo_mio on public.conteos_caja;
create trigger solo_lo_mio before insert or update of capital_id on public.conteos_caja
  for each row execute function public.solo_lo_mio('capital_id', 'capital');

-- USR-6: el tope de cada cuenta. Sin fila rige el de por defecto (10.000);
-- con max_filas vacío, sin tope. Solo se cambia desde el SQL Editor.
create table if not exists public.limites (
  user_id uuid primary key references auth.users (id) on delete cascade,
  max_filas integer check (max_filas is null or max_filas >= 0)
);

-- USR-5: cuántas filas tiene cada cuenta, sumando todas sus tablas.
create table if not exists public.uso (
  user_id uuid primary key references auth.users (id) on delete cascade,
  filas integer not null default 0
);

-- Cada cuenta lee su tope y su uso, pero no puede escribirlos.
alter table public.limites enable row level security;
alter table public.uso enable row level security;
drop policy if exists "ver lo mio" on public.limites;
create policy "ver lo mio" on public.limites for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "ver lo mio" on public.uso;
create policy "ver lo mio" on public.uso for select to authenticated using (user_id = (select auth.uid()));

-- Suma o resta una fila al uso de la cuenta y rechaza la carga que pasa el
-- tope. Corre con permisos del dueño de la base porque `uso` no se puede
-- escribir desde la app; solo toca la cuenta de la fila, que la seguridad
-- por filas ya obliga a que sea la tuya.
create or replace function public.contar_filas() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  usadas integer;
  tope integer := 10000;
begin
  if tg_op = 'DELETE' then
    update public.uso set filas = greatest(0, filas - 1) where user_id = old.user_id;
    return old;
  end if;
  insert into public.uso (user_id, filas) values (new.user_id, 1)
    on conflict (user_id) do update set filas = public.uso.filas + 1
    returning filas into usadas;
  select l.max_filas into tope from public.limites l where l.user_id = new.user_id;
  if not found then
    tope := 10000;
  end if;
  if tope is not null and usadas > tope then
    raise exception 'Llegaste al límite de datos de tu cuenta.' using hint = 'Pedile al dueño de la app que te lo amplíe.';
  end if;
  return new;
end $$;

do $$
declare
  tabla text;
begin
  foreach tabla in array array[
    'ajustes', 'maquinas', 'clientes', 'productos', 'compras', 'pagos_cuotas', 'ventas', 'venta_items', 'cobros',
    'impresiones', 'impresion_filamentos', 'capital', 'bambu_conexion', 'bambu_impresiones', 'conteos_caja'
  ] loop
    execute format('drop trigger if exists contar_filas on public.%I', tabla);
    execute format('create trigger contar_filas after insert or delete on public.%I for each row execute function public.contar_filas()', tabla);
  end loop;
end $$;

-- El uso de hoy de cada cuenta, contando lo que ya tenía.
insert into public.uso (user_id, filas)
select user_id, count(*) from (
  select user_id from public.ajustes union all
  select user_id from public.maquinas union all
  select user_id from public.clientes union all
  select user_id from public.productos union all
  select user_id from public.compras union all
  select user_id from public.pagos_cuotas union all
  select user_id from public.ventas union all
  select user_id from public.venta_items union all
  select user_id from public.cobros union all
  select user_id from public.impresiones union all
  select user_id from public.impresion_filamentos union all
  select user_id from public.capital union all
  select user_id from public.bambu_conexion union all
  select user_id from public.bambu_impresiones union all
  select user_id from public.conteos_caja
) filas
group by user_id
on conflict (user_id) do update set filas = excluded.filas;

-- Hasta hoy la app tenía un solo usuario, el dueño: su cuenta queda sin tope.
-- Si ya creaste otras cuentas, corré esto a mano con tu id en vez del primero.
insert into public.limites (user_id, max_filas)
select id, null from auth.users order by created_at limit 1
on conflict (user_id) do nothing;
