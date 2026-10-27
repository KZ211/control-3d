# Plata: caja, bolsillo y reinversión

Hay dos bolsas de plata: **la caja** (la plata del emprendimiento) y **tu
bolsillo** (la tuya). Toda compra, cuota o movimiento dice de cuál salió.

### PLATA-1 · Qué mueve la caja
Entra: cada cobro y seña, cada aporte tuyo.
Sale: gastos de venta, compras pagadas con caja, cuotas pagadas con caja,
retiros para vos.
No la tocan: compras y cuotas pagadas de tu bolsillo, el inventario
(`inicial`) y lo gastado (PLATA-3).
Los movimientos se ordenan por fecha y, el mismo día, por orden de carga. La
caja de hoy es el saldo del último.
Código: `movimientosDeCaja` en lib/calculos.js

### PLATA-2 · Tu bolsillo
- Aportado = compras pagadas de tu bolsillo + cuotas pagadas de tu bolsillo + aportes.
- Retirado = retiros.
- Gastado = movimientos de tipo `gasto`.

### PLATA-3 · Gastado sale de tu bolsillo, no de la caja
"Gastado" es plata que ya habías sacado con un retiro y se gastó en algo que
no se registró, o se perdió. Ya no está ni en la caja ni con vos. Se resta de
lo que te quedó del retiro; la caja no cambia.

### PLATA-4 · Contar la caja
Comparás lo que hay de verdad con lo que calcula la app. Si la diferencia es
de $1 o más:
- Si falta: queda un **retiro** por la diferencia. Si además se gastó, también
  queda un **gastado** por el mismo monto (retiro + gastado).
- Si sobra: queda un **aporte** por la diferencia.

Desde ahí la caja de la app es la real. Se puede deshacer: se borran el
conteo, el retiro o aporte y el gastado, y vuelve el punto de partida anterior.
Ejemplo: la app dice $50.000, contás $42.000 y se gastó → retiro $8.000 y gastado $8.000.
Código: `contarCaja` en app/acciones.js

### PLATA-5 · Punto de partida
El primer conteo de caja fija el punto de partida. Los siguientes lo mueven
solo si lo elegís. Desde esa fecha se reparte cada venta (PLATA-6). No borra
nada del historial.

### PLATA-6 · Plan de la caja
Desde el punto de partida, la caja tiene que guardar:
- **Reponer**: gramos vendidos × precio de hoy del gramo, menos el filamento ya comprado con caja.
- **Desgaste**: el desgaste de las piezas vendidas, menos lo gastado con caja en máquinas, accesorios y repuestos.
- **Próxima cuota**: la siguiente de cada compra en cuotas que se debe.

Necesario = reponer + desgaste + próxima cuota. Lo que pasa de eso se puede sacar.
- Precio de hoy del gramo = promedio del stock que tenés; sin stock, el de Ajustes.
- Si una pieza no tiene desgaste calculado, se usa el desgaste promedio por
  gramo de las impresiones que sí lo tienen.
- "Sacaste" cuenta los retiros desde el punto de partida, sin los generados
  al contar la caja.
- El reparto en porcentajes usa las ventas entregadas de los últimos 90 días;
  la cuota se compara con lo que vendés en un mes promedio (90 días / 3).

Código: `planDeCaja` en lib/calculos.js

### PLATA-7 · Reinversión
Para reinvertir = lo cobrado × porcentaje de reinversión (34% por defecto).
Reinvertido = compras y cuotas pagadas con caja.
Disponible = para reinvertir − reinvertido.

### PLATA-8 · Cuotas
Una compra en cuotas guarda el total y la cantidad de cuotas. Valor de la
cuota = total / cuotas. Debe = total − pagado, nunca menos de 0. Cada pago
dice si salió de la caja o de tu bolsillo (bolsillo por defecto).
El AMS se paga en 9 cuotas de $53.825,99 ($484.433,91).

## Preguntas abiertas
- "Total de deuda $587.800" de la hoja Deuda (celda G2): no se sabe qué es.
