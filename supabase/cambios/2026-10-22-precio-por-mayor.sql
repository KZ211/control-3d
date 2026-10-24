-- Multiplicador para el precio por mayor (lo cambiás en Ajustes).
-- Correlo una vez en Supabase > SQL Editor.
alter table public.ajustes
  add column if not exists multiplicador_mayor numeric(5, 2) not null default 4 check (multiplicador_mayor >= 1);
