-- "Ya la cargué" en Taller > Por revisar: marca una impresión de Bambu como
-- revisada sin crear nada, porque ya la cargaste a mano. Correlo una vez en
-- Supabase > SQL Editor si ya habías corrido 2026-10-25-bambu-lab.sql.

alter table public.bambu_impresiones drop constraint if exists bambu_impresiones_decision_check;
alter table public.bambu_impresiones
  add constraint bambu_impresiones_decision_check check (decision in ('pendiente', 'venta', 'stock', 'prueba', 'ignorar', 'cargada'));
