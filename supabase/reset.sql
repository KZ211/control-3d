-- Borra todas las tablas de Control 3D con sus datos, para volver a correr
-- schema.sql desde cero. No se puede deshacer.
drop table if exists
  public.impresion_filamentos,
  public.impresiones,
  public.cobros,
  public.venta_items,
  public.ventas,
  public.pagos_cuotas,
  public.compras,
  public.productos,
  public.clientes,
  public.capital,
  public.maquinas,
  public.ajustes
cascade;
