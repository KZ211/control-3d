# Filamento

### FIL-1 · Un lote es una compra de filamento
Gramos del lote = rollos × gramos por rollo (1.000 g si no se dice).
Precio por gramo = total pagado / gramos del lote.
Ejemplo: 2 rollos de 1.000 g por $40.000 → $20/g.

### FIL-2 · Gramos usados de un lote
Usados = gramos de las impresiones que eligieron ese lote + lo descontado sin
lote (FIL-3) + la corrección al pesarlo (FIL-4).
Quedan = gramos del lote − usados, nunca menos de 0.
Valor del stock = quedan × precio por gramo. Los lotes marcados como agotados no cuentan.

### FIL-3 · Gramos sin rollo elegido
Las piezas vendidas sin impresiones (estimadas) y las impresiones sin lote se
descuentan de los rollos más viejos primero, pero **solo de los rollos que ya
tenías ese día**. Si el uso y el rollo son del mismo día, cuenta el orden en
que se cargaron.
- Lo que no entra en ningún rollo queda como "sin rollo".
- Lo usado antes de la fecha del primer inventario (FIL-5) no falta: ya está
  contado en ese inventario.

Ejemplo: rollo comprado el 10/10 y venta estimada del 5/10 → la venta no se
descuenta de ese rollo.
Código: `construir` en lib/calculos.js

### FIL-4 · Corregir los gramos de un rollo
Se pueden corregir los rollos y los gramos por rollo (cambia el precio por
gramo) y, si lo pesaste, cuánto queda. Lo que queda se guarda como la
diferencia con lo que calcula la app (`gramos_ajuste`, positivo = se usó más
de lo registrado). Si queda algo, el lote deja de estar agotado.
Ejemplo: lote de 1.000 g, la app calcula 300 g usados, pesás 600 g →
ajuste = 1.000 − 600 − 300 = 100.

### FIL-5 · Inventario ("ya lo tenía")
El filamento que tenés hoy se carga por rollo, a precio de hoy, con forma de
pago `inicial`: no sale de la caja ni de tu bolsillo. Cada rollo necesita
precio, porque es lo que cuesta reponerlo. Si lo pedís, los rollos cargados de
antes quedan agotados. Se puede deshacer.

## Preguntas abiertas
- Ninguna por ahora.
