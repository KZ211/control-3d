# Ventas, cobros y clientes

### VEN-1 · Qué es una venta
Un pedido de un cliente con una o varias piezas (`venta_items`). Estado:
`encargo` (todavía no se entregó) o `entregada`. Sin al menos una pieza con
descripción no se guarda.

### VEN-2 · Cargar una venta es todo o nada
Si falla cualquier paso, se borra lo que se llegó a guardar: la venta, sus
piezas y cobros, las impresiones creadas desde Bambu (vuelven a la bandeja) y
el cliente si se creó en esa carga. Los montos se leen antes de guardar nada.
Código: `crearVenta` en app/acciones.js

### VEN-3 · Cobro al cargar
"Pagó todo" registra un cobro por el total. Si no, se registra lo cobrado, si
hay. Lo cobrado de un encargo es una seña.

### VEN-4 · Total, cobrado y saldo
- Total = Σ precio de las piezas.
- Cobrado = Σ cobros.
- Saldo = total − cobrado.
- Neta de la venta = total − gastos de venta.
- Ganancia = neta − costo (material + luz + desgaste).

Ejemplo: piezas por $30.000, gastos $1.000, costo $6.000, cobros $10.000 →
saldo $20.000, ganancia $23.000.

### VEN-5 · Entregar y cobrar se pueden deshacer
Entregar pasa la venta a `entregada` con la fecha de entrega y, opcionalmente,
un cobro. Deshacer vuelve a `encargo` con la fecha anterior y borra ese cobro.
Un cobro suelto también se puede deshacer.

### VEN-6 · Editar una venta
Usa el mismo formulario que la carga rápida. Las piezas que se sacan se
borran, las que siguen se actualizan y las nuevas se agregan. Si al cambiar
precios marcás que ya cobraste la diferencia, se registra un cobro por ella.

### VEN-7 · Clientes por nombre
"Lucía Prima" y "lucia  prima" son el mismo cliente: no importan tildes,
mayúsculas ni espacios. Si el nombre no existe, se crea.
Código: lib/nombres.js

### VEN-8 · Unir clientes
Las ventas del cliente origen pasan al destino, se completan los datos que le
falten al destino y el origen se borra.

### VEN-9 · Lo que debe un cliente
Debe = Σ saldos positivos de sus ventas entregadas. Los encargos no cuentan
como deuda del cliente.

### VEN-10 · Productos del catálogo
Son un atajo opcional, no el camino principal. Para cada uno se muestra cuánto
se vendió (solo ventas entregadas), a qué precio promedio, cuánto dejó y el
precio sugerido (COSTO-5).

### VEN-11 · Carga rápida siempre a mano
La carga de ventas está en toda la app (botón "+ Venta" y tecla N). Ningún dato
opcional puede bloquear la carga.

## Preguntas abiertas
- Columna L de la hoja Ventas: se asumió que las filas con K=0 y L>0 (Lean
  $20.000, Holy cel $27.600) están sin cobrar.
- Las ventas de la planilla no tienen fecha; los datos iniciales las ponen el 2026-10-21.
- Posibles clientes duplicados: Luk Tech/Luca tech, Holy cel/Marcos holycel,
  Chivi/Chivi prima, Isa caminos/Los caminos.
