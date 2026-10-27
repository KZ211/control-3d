# Control 3D

App personal de cuentas para un emprendimiento de impresión 3D. Qué es y para
quién: `PRODUCT.md`. Cómo correrla y cómo está armada: `README.md`.

## Reglas de negocio: specs primero

Las reglas viven en `specs/` y son la fuente de verdad (proceso completo en
`specs/README.md`).

- Antes de cambiar cómo se calcula o se guarda algo, leé la spec del área y
  actualizala primero, con un ejemplo con números. Si una regla no está clara,
  preguntá al dueño y anotá la duda en "Preguntas abiertas"; no la adivines.
- Si el código y la spec no coinciden, avisá antes de tocar cualquiera de los dos.
- Las pruebas de un cálculo citan el id de la regla (`PLATA-4`), y el commit o
  PR nombra las reglas que tocó.
- Estilos, textos y arreglos que vuelven a cumplir una spec no pasan por specs.

## Cómo ubicarte en el código: graphify

Hay un grafo del proyecto en `graphify-out/` (código, tablas SQL, docs y specs).

- Para preguntas de estructura ("¿dónde se calcula X?", "¿qué usa Y?", "¿qué
  código implementa PLATA-6?"), leé `graphify-out/GRAPH_REPORT.md` o corré
  `graphify query "<pregunta>"` antes de leer archivos enteros.
- Cada regla de `specs/` es un nodo unido por `implements` a las funciones que
  nombra entre comillas invertidas.
- Los hooks de git reconstruyen la parte del código después de cada commit,
  checkout o merge. Los cambios en specs o docs no: después de tocarlos, corré
  `/graphify . --update`.

## Convenciones

- Español rioplatense con voseo en la interfaz, los comentarios y los commits.
- Todos los números salen de `lib/calculos.js` (funciones puras, con `npm test`).
  Todo lo que escribe en la base está en `app/acciones.js`.
- Cada cambio de la base va en `schema.sql` y además en
  `supabase/cambios/AAAA-MM-DD-tema.sql`.
- Nunca usar la clave secret/service_role de Supabase.
