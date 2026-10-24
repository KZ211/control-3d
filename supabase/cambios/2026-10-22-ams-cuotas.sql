-- AMS: 9 cuotas de $53.825,99 (antes estaba cargado como 9 de $50.000) y las
-- dos primeras ya pagadas. Correlo una vez en Supabase > SQL Editor si ya
-- habías cargado datos-iniciales.sql antes del 22/10/2026.
--
-- Las cuotas quedan pagadas de tu bolsillo con fecha de hoy. Si fue con plata
-- de las ventas o en otra fecha, borralas en Compras y cargalas de nuevo.

do $$
declare
  u uuid := (select id from auth.users limit 1);
  ams uuid := (select id from public.compras where user_id = u and descripcion = 'AMS' limit 1);
begin
  if ams is null then
    raise exception 'No encontré la compra del AMS.';
  end if;

  update public.compras set total = 484433.91, cuotas = 9, notas = '9 cuotas de $53.825,99' where id = ams;

  if not exists (select 1 from public.pagos_cuotas where compra_id = ams) then
    insert into public.pagos_cuotas (user_id, compra_id, fecha, monto, pagado_con) values
      (u, ams, current_date, 53825.99, 'bolsillo'),
      (u, ams, current_date, 53825.99, 'bolsillo');
  end if;
end $$;
