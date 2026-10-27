# Costos y precios

### COSTO-1 · Costo de una impresión
Costo = material + luz + desgaste.
- Material = Σ gramos de cada filamento × su precio por gramo, guardado al cargar la impresión.
- Luz = horas × (watts de la máquina / 1000) × precio del kWh de Ajustes.
- Desgaste = horas × desgaste por hora de la máquina (COSTO-2).

Sin máquina, luz y desgaste valen 0.
Ejemplo: 50 g a $20/g, 2 h, máquina de 150 W, kWh a $100, desgaste $40/h → 1.000 + 30 + 80 = $1.110.
Código: `costoDeImpresion` en lib/calculos.js

### COSTO-2 · Precio y desgaste de una máquina
El precio de una máquina no se guarda en la máquina: es la suma de las compras
de categoría `maquina` o `accesorio` asociadas a ella. Desgaste por hora =
precio / vida útil en horas (5.000 por defecto).
Valor de hoy de la máquina = precio − horas usadas × desgaste por hora, nunca menos de 0.

### COSTO-3 · Costo de una pieza vendida
- Con impresiones asignadas: la suma de sus costos reales (material, luz y desgaste).
- Sin impresiones: se estima como en la planilla, cantidad × gramos por unidad × precio por gramo. Solo material, sin luz ni desgaste.

Una pieza estimada con 0 gramos queda "sin costo" y se marca para completarla.
Ganancia de la pieza = precio − costo.

### COSTO-4 · Precio por gramo de una pieza
Cada pieza guarda su precio por gramo. Si la venta no lo trae, toma el de
Ajustes (`costo_gramo`, $20 por defecto). Al editar una venta, la pieza manda
el precio por gramo que trae el formulario.

### COSTO-5 · Precio sugerido
Precio sugerido = costo del filamento × multiplicador.
- Multiplicador normal: ×5 por defecto (la planilla usó ×3, ×4 y ×5).
- Multiplicador por mayor: ×4 por defecto.

Para productos del catálogo, el costo es gramos por unidad × precio por gramo de Ajustes.
Ejemplo: 40 g × $20 = $800 → sugerido $4.000, por mayor $3.200.

### COSTO-6 · Destino de una impresión sin venta
Una impresión que no está en una venta es de `stock`, `propia` (para vos),
`regalo` o `prueba`. Puede marcarse como `fallida`.

## Preguntas abiertas
- Ninguna por ahora.
