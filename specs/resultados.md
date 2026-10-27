# Recuperación, resultado y balance

### RES-1 · Ganancia neta (la de la planilla)
Ganancia neta = lo cobrado de las ventas entregadas − el filamento de sus
piezas. No resta luz, desgaste ni otros gastos.
Código: `gananciaNeta` en lib/calculos.js

### RES-2 · Recuperación del equipo
Un solo número para todo el equipo, no por máquina.
- Equipo = Σ compras de categoría `maquina` o `accesorio` (las tres
  impresoras, $1.130.000, más el AMS).
- Falta por recuperar = equipo − ganancia neta.
- Avance = ganancia neta / equipo.

El AMS cuenta como equipo pero se muestra aparte, como cuotas. El filamento
comprado no entra: lo paga el costo de cada pieza. También se muestra cuánto
sumaría lo que te deben cuando lo cobres.

### RES-3 · Resultado de un período
Solo cuentan las ventas entregadas con fecha dentro del período.
- Bruto = Σ totales.
- Neto = bruto − gastos de venta.
- Ganancia = neto − material − luz − desgaste − impresiones sin venta − otros gastos.
- Impresiones sin venta = las que no son de stock (propias, regalos, pruebas)
  y las fallidas, de ese período.
- Otros gastos = compras de categoría `insumo`, `repuesto` u `otro` del período.

Las piezas en stock no son gasto hasta que se venden.
Código: `resultado` en lib/calculos.js

### RES-4 · Balance de hoy
Activos = caja + por cobrar + stock de filamento + piezas hechas sin vender +
valor de las máquinas + equipos sin máquina asociada.
- Por cobrar = Σ saldos positivos de las ventas entregadas.
- Piezas hechas = impresiones no fallidas de stock o de encargos sin
  entregar, a lo que costaron.
- Valor de las máquinas: COSTO-2.

Deudas = lo que falta pagar de cuotas + señas de encargos (plata que entró
por un trabajo que todavía debés).
Patrimonio = activos − deudas.
Ganado = patrimonio − (aportado − retirado).

### RES-5 · Impresiones para vos
Se muestran aparte: cuántas, cuánto costaron y cuánto valdrían.

## Preguntas abiertas
- Ninguna por ahora.
