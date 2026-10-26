-- "Gastado" en Plata > Tu bolsillo: plata que salió de la caja pero no fue a tu
-- bolsillo (se gastó en algo que no se registró, o se perdió). Correlo una vez
-- en Supabase > SQL Editor.
alter table public.capital drop constraint if exists capital_tipo_check;
alter table public.capital add constraint capital_tipo_check check (tipo in ('aporte', 'retiro', 'gasto'));
