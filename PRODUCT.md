# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Una sola persona: el dueño de un emprendimiento chico de impresión 3D en Argentina, que imprime, vende y lleva las cuentas solo. No es contador; aprende los conceptos (bruto, neto, caja, balance, recupero) mientras usa la app. El dueño también puede crear cuentas a mano para otras personas con su propio emprendimiento: cada una usa la app entera con sus datos, aislados de los demás. Carga datos a veces desde el celular y a veces desde la computadora, según el día: al momento de una venta o juntando varias para cargarlas después.

## Product Purpose

Reemplazar la planilla "Costos empresa 3D", que dejó de servir porque cargar cada venta daba pereza y se terminaba perdiendo la contabilidad. El éxito es que nunca quede una venta sin anotar: cargar una tiene que tomar segundos, desde cualquier pantalla. Con eso al día, la app responde lo que la planilla calculaba a mano: cuánto falta para que la ganancia neta pague el equipo (tres impresoras y el AMS en cuotas), cuánto hay en la caja, quién debe, qué conviene cobrar y si el mes dio ganancia.

## Positioning

Una herramienta personal hecha a la medida de las reglas de su propia planilla, no un sistema de gestión genérico: el precio sugerido es el costo del filamento por un multiplicador (×5, y otro configurable por mayor), la ganancia neta es lo cobrado menos el filamento de cada pieza, se aparta un 34% para reinvertir y la recuperación compara esa ganancia con el precio entero del equipo. Explica cada número con los datos propios del usuario.

## Operating Context

- Ventas a conocidos y familia (boca en boca), en ferias o en persona, y pedidos por mayor para reventa. Muchos clientes se nombran como en la planilla ("Tia jorge", "Lucia prima").
- Casi todo se hace por encargo: el cliente elige un modelo o pide que se lo diseñen, y se imprime. Repetir un producto es poco común, así que el catálogo es un atajo opcional y no el camino principal para cargar una venta.
- Una venta es un pedido con una o varias piezas; puede quedar como encargo con seña o entregada con o sin cobrar del todo.
- El costo de cada pieza sale de los gramos × el precio por gramo del rollo; con impresiones cargadas se suman luz y desgaste de la máquina.
- La plata invertida salió del bolsillo del dueño (una liquidación); el AMS se paga en 9 cuotas de $53.825,99.
- Rutina buscada: cargar cada venta y compra, hacer caja una vez por semana, mirar el resultado del mes.

## Capabilities and Constraints

- Next.js 14 (App Router) con Supabase; usuarios con login creados a mano (sin registro), todas las tablas protegidas por RLS "solo el dueño" y con tope de filas por cuenta. Nunca usar la clave secret/service_role.
- Secciones: Panel, Ventas, Taller (impresiones, productos, máquinas), Compras (filamento, cuotas), Plata (recuperación, caja, bolsillo, reinversión), Aprender y Ajustes.
- La carga rápida de ventas está disponible en toda la app (botón "+ Venta" y tecla N) y es la función prioritaria.
- Moneda: pesos argentinos, formato es-AR. Idioma de la interfaz: español rioplatense, con voseo.
- Los cálculos viven en `lib/calculos.js` y tienen pruebas contra los totales de la planilla.

## Brand Commitments

Nombre: Control 3D. Voz cercana y directa, en voseo, que explica sin jerga ("Te falta recuperar", "Te deben", "Tu bolsillo"). Sin otros activos de marca definidos.

## Evidence on Hand

- La planilla original y sus exportaciones (Ventas, Deuda, Impresión propia), volcadas en `supabase/datos-iniciales.sql` y en el fixture `lib/planilla.test.json`.
- No hay testimonios, clientes publicables, fotos de productos ni logo. No inventarlos.

## Product Principles

1. Cargar una venta tiene que ser más fácil que no cargarla: pocos toques, valores por defecto inteligentes, nunca bloquear por datos opcionales.
2. Cada número se puede explicar: si la app muestra una cifra, puede decir de dónde sale con los datos del usuario.
3. Las cuentas de la planilla mandan: la app calcula igual que el dueño, y lo que cambia se configura en Ajustes.
4. Lo urgente a la vista: lo que falta cobrar, los encargos pendientes y las ventas sin anotar aparecen antes que el análisis.
5. Funciona igual de bien en el celular y en la computadora.
