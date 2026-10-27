# Specs de Control 3D

Las reglas de negocio de la app, escritas en palabras. Son la fuente de verdad:
si el código y una spec no coinciden, uno de los dos está mal y hay que decidir
cuál antes de seguir.

## Cómo se trabaja (spec-driven)

1. **Spec primero.** Todo cambio de comportamiento empieza acá: se agrega o se
   cambia la regla en el archivo que corresponde, con un ejemplo con números.
2. **Acordar.** La regla se revisa con el dueño antes de programar. Las dudas
   van a "Preguntas abiertas" del archivo, no se adivinan.
3. **Plan.** Qué archivos cambian (`lib/calculos.js`, `app/acciones.js`, una
   pantalla, un SQL en `supabase/cambios/`).
4. **Código y prueba.** Si la regla es un cálculo, lleva una prueba en
   `lib/calculos.test.mjs` que cite el id de la regla (por ejemplo `PLATA-3`).
5. **Cerrar.** El commit o PR nombra las reglas que tocó. Si el cambio
   reemplaza una regla, se edita la regla (no se deja la vieja al lado).

Cambios que no tocan reglas (estilos, textos, arreglos que vuelven a cumplir
una spec) no necesitan pasar por acá.

## Formato

Cada archivo es un área. Cada regla tiene un id fijo (`AREA-n`), una frase que
la dice y, cuando hace falta, un ejemplo con números y dónde vive en el código.
Los ids no se reutilizan: si una regla se borra, su número queda libre.

```
### VEN-4 · Saldo de una venta
Saldo = total de las piezas − suma de los cobros.
Ejemplo: piezas por $30.000, cobros por $10.000 → saldo $20.000.
Código: `construir` en lib/calculos.js
```

## Áreas

| Archivo | Qué cubre |
|---|---|
| [costos.md](costos.md) | Costo de una pieza, precio sugerido, ajustes |
| [ventas.md](ventas.md) | Ventas, encargos, cobros, clientes, productos |
| [filamento.md](filamento.md) | Rollos, precio por gramo, gramos usados, inventario |
| [plata.md](plata.md) | Caja, tu bolsillo, conteos, punto de partida, reinversión |
| [resultados.md](resultados.md) | Recuperación del equipo, resultado del mes, balance |
| [plataforma.md](plataforma.md) | Usuario, seguridad, idioma, cambios de la base |
