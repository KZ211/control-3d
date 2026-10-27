# Usuarios

La app la usan varias personas, cada una con su propio emprendimiento y sus
propios datos. El dueño de la app crea las cuentas a mano; no hay registro.

### USR-1 · El dueño crea las cuentas a mano
Una cuenta nueva se crea en Supabase: Authentication → Users → Add user, con
email, contraseña y "Auto Confirm User". El registro abierto sigue cerrado
(PLAT-1). No hay pantalla para crear usuarios dentro de la app.

### USR-2 · Cada usuario usa la app entera con sus datos
Todas las secciones (ventas, taller, compras, plata, stock) funcionan igual
para cualquier usuario. Un usuario nuevo arranca vacío, con los ajustes por
defecto (×5, ×4 por mayor, $20/g, 34%) hasta que guarde los suyos.

### USR-3 · Nadie ve los datos de otro, tampoco el dueño
Desde la app cada usuario ve y modifica solo sus filas (PLAT-2). El dueño no
tiene un rol especial: para revisar datos ajenos usa el panel de Supabase.

### USR-4 · Ninguna fila apunta a datos de otro usuario
La base rechaza guardar una fila que referencie una fila de otro usuario (una
pieza en la venta de otro, una impresión con el rollo de otro, etc.), aunque
alguien conozca su id. Si la referencia es vacía (null) no se revisa.
Mensaje: "Eso no es tuyo."
Código: `solo_lo_mio` en supabase/cambios/2026-10-27-usuarios.sql

Referencias revisadas:
| Tabla | Columnas |
|---|---|
| compras | maquina_id |
| pagos_cuotas | compra_id |
| ventas | cliente_id |
| venta_items | venta_id, producto_id |
| cobros | venta_id |
| impresiones | producto_id, venta_item_id, maquina_id |
| impresion_filamentos | impresion_id, compra_id |
| bambu_impresiones | impresion_id |
| conteos_caja | capital_id |

### USR-5 · Tope de datos por usuario
Cada usuario puede guardar hasta **10.000 filas** sumando todas sus tablas.
- Con la base actual del dueño (75 ventas de la planilla), eso alcanza para
  años de uso de un emprendimiento chico. 10.000 filas ocupan unos 3 MB.
- Al llegar al tope, la carga se rechaza con: "Llegaste al límite de datos de
  tu cuenta. Pedile al dueño de la app que te lo amplíe." No se borra nada.
- Borrar filas libera lugar.
- Ajustes, la conexión con Bambu y los conteos de caja también cuentan.

### USR-6 · El tope lo cambia solo el dueño
El tope de cada usuario se guarda en la tabla `limites`. Sin fila, rige el tope
por defecto (USR-5). Con `max_filas` vacío (null), la cuenta no tiene tope: así
queda la del dueño. Un usuario puede leer su tope y su uso, pero no cambiarlos;
solo se cambian desde el SQL Editor de Supabase.
Ejemplo: `insert into public.limites (user_id, max_filas) values ('<id>', 20000)`.
Al correr el cambio en una base que ya existía, la cuenta más vieja (la del
dueño) queda sin tope.

### USR-7 · Ver cuánto usaste
En Ajustes se muestra "Usaste X de Y datos" (o "Sin límite"), con una barra.

### USR-8 · Los datos de la planilla van a una cuenta elegida por email
`supabase/datos-iniciales.sql` carga la planilla en la cuenta cuyo email se
escribe al principio del archivo, y le saca el tope a esa cuenta. Si no
existe, corta con un error. Nunca elige "el primer usuario".

## Preguntas abiertas
- Ninguna por ahora.
