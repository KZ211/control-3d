-- Datos de la planilla "Costos empresa 3D" (hojas Deuda, Ventas e Impresion propia).
-- Correlo una sola vez, después de schema.sql y de crear tu usuario
-- (Authentication > Users > Add user). Se cargan a tu usuario.
--
-- Lo que la planilla no dice y quedó supuesto (corregilo en la app):
-- * Fechas: las compras quedan el 23/05/2026 (la fecha de la hoja Deuda) y las
--   ventas e impresiones propias el 21/10/2026. Cambialas desde Ventas y Compras
--   si querés ver el resultado mes por mes.
-- * Todas las compras se pagaron de tu bolsillo, salvo el AMS: 9 cuotas de
--   $53.825,99 con 2 pagadas (de tu bolsillo, con fecha 21/10/2026).
--   Si alguna la pagaste con plata de las ventas,
--   cambiala a "caja".
-- * Las filas con precio $0 y un monto en la columna L (Lean $20.000 y Holy cel
--   $27.600) quedaron como ventas sin cobrar.
-- * Las filas con cantidad 0 y sin precio (Prima aldana y Zara bebe) quedaron
--   como encargos.
-- * Las filas sin cliente son del mismo pedido que la fila de arriba.

do $$
declare
  u uuid := (select id from auth.users limit 1);
  dia_compras date := '2026-05-23';
  dia_ventas date := '2026-10-21';
  -- Para que las ventas queden en el orden de la planilla.
  momento timestamptz := '2026-10-21 12:00-03';
  ender uuid;
  mini uuid;
  a1 uuid;
  v uuid;
  i uuid;
begin
  if u is null then
    raise exception 'Primero creá tu usuario en Authentication > Users > Add user';
  end if;

  insert into public.ajustes (user_id, costo_gramo, multiplicador, multiplicador_mayor, reinversion_pct) values (u, 20, 5, 4, 34) on conflict do nothing;

  insert into public.maquinas (user_id, nombre, consumo_watts) values (u, 'Ender 3 V2', 150) returning id into ender;
  insert into public.maquinas (user_id, nombre, consumo_watts) values (u, 'Bambu Lab A1 mini', 100) returning id into mini;
  insert into public.maquinas (user_id, nombre, consumo_watts) values (u, 'Bambu Lab A1', 100) returning id into a1;

  -- Hoja Deuda. Equipo a recuperar: impresoras $1.130.000 + AMS $484.433,91.
  insert into public.compras (user_id, fecha, descripcion, categoria, cantidad, total, forma_pago, cuotas, maquina_id, gramos_por_unidad, notas) values
    (u, dia_compras, 'Ender 3 V2', 'maquina', 1, 150000, 'bolsillo', null, ender, null, null),
    (u, dia_compras, 'Bambu Lab A1 mini', 'maquina', 1, 340000, 'bolsillo', null, mini, null, null),
    (u, dia_compras, 'Filamento', 'filamento', 5, 90000, 'bolsillo', null, null, 1000, '5 rollos a $18.000'),
    (u, dia_compras, 'Fijador', 'insumo', 1, 7800, 'bolsillo', null, null, null, null),
    (u, dia_compras, 'Filamento', 'filamento', 4, 74500, 'bolsillo', null, null, 1000, null),
    (u, dia_compras, 'Filamento', 'filamento', 6, 122000, 'bolsillo', null, null, 1000, null),
    (u, dia_compras, 'Bambu Lab A1', 'maquina', 1, 640000, 'bolsillo', null, a1, null, null),
    (u, dia_compras, 'Filamento', 'filamento', 1, 98900, 'bolsillo', null, null, 1000, 'Revisá los gramos: el precio parece de varios rollos o de un rollo especial'),
    (u, dia_compras, 'AMS', 'accesorio', 1, 484433.91, 'cuotas', 9, a1, null, '9 cuotas de $53.825,99');

  -- Las dos primeras cuotas del AMS ya están pagas.
  insert into public.pagos_cuotas (user_id, compra_id, fecha, monto, pagado_con)
    select u, id, dia_ventas, 53825.99, 'bolsillo' from public.compras where user_id = u and descripcion = 'AMS'
    union all
    select u, id, dia_ventas, 53825.99, 'bolsillo' from public.compras where user_id = u and descripcion = 'AMS';

  insert into public.clientes (user_id, nombre) values
    (u, 'Adrian'),
    (u, 'Ale'),
    (u, 'Alfareria'),
    (u, 'Ana Diseño'),
    (u, 'Angie prima'),
    (u, 'Ari Mecanico'),
    (u, 'Chivi'),
    (u, 'Chivi prima'),
    (u, 'Clarita'),
    (u, 'Dani Jara'),
    (u, 'Delfi'),
    (u, 'Deo'),
    (u, 'Eze bolaño'),
    (u, 'Fede codaro'),
    (u, 'Holy cel'),
    (u, 'Isa caminos'),
    (u, 'Ivan hmno'),
    (u, 'Javi'),
    (u, 'Kiosco alfaro'),
    (u, 'Lean'),
    (u, 'Libreria chaca'),
    (u, 'Los caminos'),
    (u, 'Luca tech'),
    (u, 'Lucia prima'),
    (u, 'Luk Tech'),
    (u, 'Maestras deo'),
    (u, 'Marcos holycel'),
    (u, 'Maxi'),
    (u, 'Naomi'),
    (u, 'Nico vecino'),
    (u, 'Prima aldana'),
    (u, 'Roman'),
    (u, 'Señora caballito'),
    (u, 'Tia guada'),
    (u, 'Tia Nancy'),
    (u, 'Tio jorge'),
    (u, 'Tio pitu'),
    (u, 'Vero'),
    (u, 'Zara'),
    (u, 'Zara bebe');

  insert into public.productos (user_id, nombre, gramos_unidad, precio_unidad) values
    (u, 'Portafiguritas', 75, 3500),
    (u, 'Cajita mundial', 75, 6000),
    (u, 'Trofeo', 49, null),
    (u, 'Cuchillo zanahoria', 52, 3000),
    (u, 'Soporte para raqueta', 40, 4000),
    (u, 'Luna portalámparas', 85, null),
    (u, 'Dinosaurio portalápices', 165, 12000),
    (u, 'Mini ajedrez', 70.48, 8000),
    (u, 'Prensa para celular', 25.4, 2300),
    (u, 'Nombre', 2, 500);

  -- Un pedido por cliente, en el orden de la hoja Ventas.
  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Ivan hmno'), 'entregada', 'De la planilla', momento + interval '0 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Cuchillo zanahoria'), 'Cuchillo Zanahoria', 1, 52, 18, 3000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 3000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Ari Mecanico'), 'entregada', 'De la planilla', momento + interval '1 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'F1 adorno', 2, 70.28, 18, 8000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 8000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Tia guada'), 'entregada', 'De la planilla', momento + interval '2 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Soporte harry potter', 1, 78, 18, 4500, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 4500);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Roman'), 'entregada', 'De la planilla', momento + interval '3 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Lambo y RX7', 2, 18, 18, 3000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 3000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Tia Nancy'), 'entregada', 'De la planilla', momento + interval '4 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Nombre lapices', 8, 8, 18, 4000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 4000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Naomi'), 'entregada', 'De la planilla', momento + interval '5 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Juguete antiestress', 1, 59, 18, 2000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 2000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Ivan hmno'), 'entregada', 'De la planilla', momento + interval '6 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Cuchillo zanahoria'), 'Cuchillo Zanahoria', 1, 52, 18, 0, 'Precio $0 en la planilla');

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Tio pitu'), 'entregada', 'De la planilla', momento + interval '7 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'MotoJose Logo vaci', 1, 13, 18, 0, 'Precio $0 en la planilla');

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Lucia prima'), 'entregada', 'De la planilla', momento + interval '8 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Stitch articulado', 1, 82, 24.5, 7000, null),
    (u, v, null, 'Stitch de cabeza', 1, 176, 18, 10000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 17000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Zara'), 'entregada', 'De la planilla', momento + interval '9 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Dinosaurio portalápices'), 'Dinosaurio Port Lapi', 2, 182, 18, 24000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 24000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Maxi'), 'entregada', 'De la planilla', momento + interval '10 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Portafiguritas'), 'Portafigu', 4, 75, 18, 14000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 14000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Delfi'), 'entregada', 'De la planilla', momento + interval '11 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Portafiguritas'), 'Portafigu', 2, 75, 18, 7000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 7000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Maxi'), 'entregada', 'De la planilla', momento + interval '12 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Portafiguritas'), 'Portafigu', 6, 75, 18, 21000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 21000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Lucia prima'), 'entregada', 'De la planilla', momento + interval '13 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Luna portalámparas'), 'Luna portalamparas', 1, 84, 18, 10000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 10000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Prima aldana'), 'encargo', 'De la planilla', momento + interval '14 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Toyota corolla', 1, 0, 18, 0, 'Cantidad 0 en la planilla: quedó como encargo');

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Zara bebe'), 'encargo', 'De la planilla', momento + interval '15 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Lapicero', 1, 0, 18, 0, 'Cantidad 0 en la planilla: quedó como encargo');

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Maxi'), 'entregada', 'De la planilla', momento + interval '16 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Portafiguritas'), 'Porta figu', 6, 75, 18, 21000, null),
    (u, v, (select id from public.productos where user_id = u and nombre = 'Portafiguritas'), 'Porta figu', 6, 75, 18, 21000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 42000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Vero'), 'entregada', 'De la planilla', momento + interval '17 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Nombre'), '130 nombres', 130, 2, 18, 79000, 'Planilla, columna L: 75');
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 79000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Clarita'), 'entregada', 'De la planilla', momento + interval '18 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Nombre'), '40 nombres', 40, 2, 18, 20000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 20000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Ale'), 'entregada', 'De la planilla', momento + interval '19 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Nombre'), 'Nombres ABC', 90, 2, 18, 45000, 'Planilla, columna L: 45');
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 45000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Libreria chaca'), 'entregada', 'De la planilla', momento + interval '20 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Portafiguritas'), 'Portafigu', 1, 75, 18, 3500, null),
    (u, v, (select id from public.productos where user_id = u and nombre = 'Portafiguritas'), 'portafigu', 3, 75, 18, 10500, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 14000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Kiosco alfaro'), 'entregada', 'De la planilla', momento + interval '21 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Portafiguritas'), 'Portafigu', 8, 75, 18, 28000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 28000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Vero'), 'entregada', 'De la planilla', momento + interval '22 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Portafiguritas'), 'Portafigu ind', 1, 75, 18, 4000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 4000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Luk Tech'), 'entregada', 'De la planilla', momento + interval '23 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Portafiguritas'), 'Portafigu', 4, 75, 18, 14000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 14000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Dani Jara'), 'entregada', 'De la planilla', momento + interval '24 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Porta casco', 2, 112, 20, 18000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 18000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Luk Tech'), 'entregada', 'De la planilla', momento + interval '25 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Portafiguritas'), 'Portafigu dorado', 1, 75, 18, 3500, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 3500);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Maxi'), 'entregada', 'De la planilla', momento + interval '26 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Portafiguritas'), 'Portafigu dorado', 6, 75, 18, 21000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 21000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Dani Jara'), 'entregada', 'De la planilla', momento + interval '27 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Garaje', 1, 75, 20, 6000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 6000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Eze bolaño'), 'entregada', 'De la planilla', momento + interval '28 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'soportes ps5', 1, 237, 20, 21000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 21000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Luca tech'), 'entregada', 'De la planilla', momento + interval '29 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Regadera', 1, 73, 18, 6000, null),
    (u, v, null, 'Desatapador de beer', 1, 25, 18, 2000, null),
    (u, v, null, 'Llaveros porta cel', 30, 6, 18, 10500, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 18500);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Chivi'), 'entregada', 'De la planilla', momento + interval '30 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Cajita rosa', 1, 75, 18, 3500, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 3500);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Luca tech'), 'entregada', 'De la planilla', momento + interval '31 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Rey + Reyna', 1, 175, 18, 14000, null),
    (u, v, null, 'Juego ajedrez', 1, 0, 18, 31000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 45000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Isa caminos'), 'entregada', 'De la planilla', momento + interval '32 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Juego XL ajedrez', 1, 2000, 18, 0, 'Precio $0 en la planilla');

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Javi'), 'entregada', 'De la planilla', momento + interval '33 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Grogu', 1, 106, 20, 10000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 10000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Luk Tech'), 'entregada', 'De la planilla', momento + interval '34 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Llaves PAPA', 3, 35.66, 20, 9000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 9000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Alfareria'), 'entregada', 'De la planilla', momento + interval '35 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Cajita mundial'), 'Cajita mundial', 1, 75, 20, 6000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 6000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Deo'), 'entregada', 'De la planilla', momento + interval '36 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Dinosaurio portalápices'), 'Dinosaurio Port Lapi', 1, 165, 20, 12000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 12000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Angie prima'), 'entregada', 'De la planilla', momento + interval '37 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Cajita mundial'), 'Cajita mundial', 1, 75, 20, 6000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 6000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Ivan hmno'), 'entregada', 'De la planilla', momento + interval '38 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Trofeo'), 'Trofeo', 1, 49, 20, 4500, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 4500);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Luk Tech'), 'entregada', 'De la planilla', momento + interval '39 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Cajita mundial'), 'Cajitas mundial', 3, 75, 20, 10500, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 10500);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Luca tech'), 'entregada', 'De la planilla', momento + interval '40 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Soporte para raqueta'), 'Soporte para raqueta', 1, 40, 20, 4000, null),
    (u, v, null, 'Android soporte', 4, 72, 20, 32000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 36000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Ivan hmno'), 'entregada', 'De la planilla', momento + interval '41 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Trofeo'), 'Trofeo', 1, 46, 20, 8000, 'Planilla, columna L: 8000');
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 8000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Luca tech'), 'entregada', 'De la planilla', momento + interval '42 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Soporte para raqueta'), 'Soporte para raqueta', 3, 40, 20, 12000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 12000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Fede codaro'), 'entregada', 'De la planilla', momento + interval '43 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Luna portalámparas'), 'Luna portalamparas', 1, 85, 20, 20000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 20000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Ivan hmno'), 'entregada', 'De la planilla', momento + interval '44 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Trofeo'), 'Trofeo', 1, 96, 30, 30000, 'Planilla, columna L: 10');
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 30000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Lean'), 'entregada', 'De la planilla', momento + interval '45 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Porta ader, bocadillo', 4, 44, 20, 20000, 'En la planilla figura aparte (columna L): sin cobrar');

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Holy cel'), 'entregada', 'De la planilla', momento + interval '46 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Prensa para celular'), 'Prensa para celular', 12, 24.66, 20, 27600, 'En la planilla figura aparte (columna L): sin cobrar');

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Lean'), 'entregada', 'De la planilla', momento + interval '47 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Llaveros abre latas', 7, 9.92, 20, 7000, 'Planilla, columna L: 7000');
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 7000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Ana Diseño'), 'entregada', 'De la planilla', momento + interval '48 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Soportes verdes', 4, 69.41, 20, 27800, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 27800);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Marcos holycel'), 'entregada', 'De la planilla', momento + interval '49 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Prensa para celular'), 'Prensas para celular', 12, 25.4, 20, 27600, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 27600);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Ana Diseño'), 'entregada', 'De la planilla', momento + interval '50 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Soportes naranjas', 2, 94.97, 20, 17000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 17000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Tia Nancy'), 'entregada', 'De la planilla', momento + interval '51 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Mini ajedrez'), 'Mini ajedrez', 1, 70.48, 20, 8000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 8000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Los caminos'), 'entregada', 'De la planilla', momento + interval '52 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, (select id from public.productos where user_id = u and nombre = 'Mini ajedrez'), 'Mini ajedrez', 4, 70.48, 20, 32000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 32000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Adrian'), 'entregada', 'De la planilla', momento + interval '53 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Chimuelos', 4, 16.45, 20, 16000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 16000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Maestras deo'), 'entregada', 'De la planilla', momento + interval '54 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Dinos personali', 2, 186.52, 20, 46000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 46000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Señora caballito'), 'entregada', 'De la planilla', momento + interval '55 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Piezas de juego de mesa', 6, 11.58, 20, 35000, null),
    (u, v, null, 'Envio', 1, 0, 20, 35000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 70000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Lucia prima'), 'entregada', 'De la planilla', momento + interval '56 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Guitarra y amplificaor', 1, 0, 20, 14000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 14000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Nico vecino'), 'entregada', 'De la planilla', momento + interval '57 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Soporte de gpu', 1, 0, 20, 4000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 4000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Luk Tech'), 'entregada', 'De la planilla', momento + interval '58 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Guardabarros', 1, 74.63, 20, 8000, null),
    (u, v, null, 'Pistolas lanzabalines', 2, 31.5, 20, 6000, null),
    (u, v, null, 'Autit', 1, 0, 20, 3000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 17000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Lucia prima'), 'entregada', 'De la planilla', momento + interval '59 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, '147 (sin detalle en la planilla)', 1, 0, 20, 21000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 21000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Tio jorge'), 'entregada', 'De la planilla', momento + interval '60 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Soportes para pinzas', 5, 0, 20, 10000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 10000);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Chivi prima'), 'entregada', 'De la planilla', momento + interval '61 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Muñeco y varita', 1, 0, 20, 28800, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 28800);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Maxi'), 'entregada', 'De la planilla', momento + interval '62 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Jueguetes dia del', 1, 0, 20, 20100, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 20100);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Chivi prima'), 'entregada', 'De la planilla', momento + interval '63 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'Comidita', 1, 0, 20, 29800, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 29800);

  insert into public.ventas (user_id, fecha, cliente_id, estado, notas, creado)
    values (u, dia_ventas, (select id from public.clientes where user_id = u and nombre = 'Nico vecino'), 'entregada', 'De la planilla', momento + interval '64 minutes') returning id into v;
  insert into public.venta_items (user_id, venta_id, producto_id, descripcion, cantidad, gramos_unidad, costo_gramo, precio, notas) values
    (u, v, null, 'soporte y pitagoras', 1, 0, 20, 13000, null);
  insert into public.cobros (user_id, venta_id, fecha, monto) values (u, v, dia_ventas, 13000);

  -- Hoja "Impresion propia": lo que imprimiste para vos, la casa o la familia.
  insert into public.impresiones (user_id, fecha, pieza, destino, para, valor, unidades, notas, creado)
    values (u, dia_ventas, 'Rascador de cama', 'propia', 'Bambu', 1000, 1, 'De la planilla', momento + interval '0 minutes') returning id into i;
  insert into public.impresion_filamentos (user_id, impresion_id, gramos, costo_gramo) values (u, i, 17, 18);
  insert into public.impresiones (user_id, fecha, pieza, destino, para, valor, unidades, notas, creado)
    values (u, dia_ventas, 'Tapa de extruder AMS', 'propia', 'Bambu', 100, 1, 'De la planilla', momento + interval '1 minutes') returning id into i;
  insert into public.impresion_filamentos (user_id, impresion_id, gramos, costo_gramo) values (u, i, 1, 18);
  insert into public.impresiones (user_id, fecha, pieza, destino, para, valor, unidades, notas, creado)
    values (u, dia_ventas, 'Silvato mini', 'propia', 'Alexis', 400, 2, 'De la planilla', momento + interval '2 minutes') returning id into i;
  insert into public.impresion_filamentos (user_id, impresion_id, gramos, costo_gramo) values (u, i, 2, 18);
  insert into public.impresiones (user_id, fecha, pieza, destino, para, valor, unidades, notas, creado)
    values (u, dia_ventas, 'Soporte libro', 'propia', 'Nao', 4500, 1, 'De la planilla', momento + interval '3 minutes') returning id into i;
  insert into public.impresion_filamentos (user_id, impresion_id, gramos, costo_gramo) values (u, i, 78, 18);
  insert into public.impresiones (user_id, fecha, pieza, destino, para, valor, unidades, notas, creado)
    values (u, dia_ventas, 'Exprimidor pasta', 'propia', 'Casa', 1500, 1, 'De la planilla', momento + interval '4 minutes') returning id into i;
  insert into public.impresion_filamentos (user_id, impresion_id, gramos, costo_gramo) values (u, i, 20, 18);
  insert into public.impresiones (user_id, fecha, pieza, destino, para, valor, unidades, notas, creado)
    values (u, dia_ventas, 'Sujeta libro harry', 'propia', 'Nao', 4500, 1, 'De la planilla', momento + interval '5 minutes') returning id into i;
  insert into public.impresion_filamentos (user_id, impresion_id, gramos, costo_gramo) values (u, i, 79, 18);
  insert into public.impresiones (user_id, fecha, pieza, destino, para, valor, unidades, notas, creado)
    values (u, dia_ventas, 'F1', 'propia', 'Tio pitu', 4000, 1, 'De la planilla', momento + interval '6 minutes') returning id into i;
  insert into public.impresion_filamentos (user_id, impresion_id, gramos, costo_gramo) values (u, i, 70, 18);
  insert into public.impresiones (user_id, fecha, pieza, destino, para, valor, unidades, notas, creado)
    values (u, dia_ventas, 'Soporte casco', 'propia', 'Alexis', 1500, 1, 'De la planilla', momento + interval '7 minutes') returning id into i;
  insert into public.impresion_filamentos (user_id, impresion_id, gramos, costo_gramo) values (u, i, 24, 18);
  insert into public.impresiones (user_id, fecha, pieza, destino, para, valor, unidades, notas, creado)
    values (u, dia_ventas, 'Tapa camara', 'propia', 'Alexis', 500, 1, 'De la planilla', momento + interval '8 minutes') returning id into i;
  insert into public.impresion_filamentos (user_id, impresion_id, gramos, costo_gramo) values (u, i, 9, 18);
  insert into public.impresiones (user_id, fecha, pieza, destino, para, valor, unidades, notas, creado)
    values (u, dia_ventas, 'Funda', 'propia', 'Alexis', 1500, 1, 'De la planilla', momento + interval '9 minutes') returning id into i;
  insert into public.impresion_filamentos (user_id, impresion_id, gramos, costo_gramo) values (u, i, 21, 18);
  insert into public.impresiones (user_id, fecha, pieza, destino, para, valor, unidades, notas, creado)
    values (u, dia_ventas, 'Caja apilable', 'propia', 'Alexis', 6000, 1, 'De la planilla', momento + interval '10 minutes') returning id into i;
  insert into public.impresion_filamentos (user_id, impresion_id, gramos, costo_gramo) values (u, i, 107, 18);
  insert into public.impresiones (user_id, fecha, pieza, destino, para, valor, unidades, notas, creado)
    values (u, dia_ventas, 'Canilleras', 'propia', 'Mama', 6000, 1, 'De la planilla', momento + interval '11 minutes') returning id into i;
  insert into public.impresion_filamentos (user_id, impresion_id, gramos, costo_gramo) values (u, i, 101, 18);
  insert into public.impresiones (user_id, fecha, pieza, destino, para, valor, unidades, notas, creado)
    values (u, dia_ventas, 'Cubre puño', 'propia', 'Alexis', 13000, 2, 'De la planilla', momento + interval '12 minutes') returning id into i;
  insert into public.impresion_filamentos (user_id, impresion_id, gramos, costo_gramo) values (u, i, 120, 18);
end $$;
