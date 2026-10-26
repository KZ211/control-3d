-- Corregir los gramos que quedan de un rollo (Compras > Filamento > Corregir
-- gramos): la diferencia entre lo que calcula la app y lo que pesás queda en
-- `gramos_ajuste` (positivo: se usó más de lo registrado). Correlo una vez en
-- Supabase > SQL Editor.
alter table public.compras add column if not exists gramos_ajuste numeric(10, 2) not null default 0;
