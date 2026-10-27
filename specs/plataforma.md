# Plataforma

### PLAT-1 · Usuarios con login, sin registro
Cada usuario entra con su email y contraseña. El registro de usuarios nuevos
está cerrado en Supabase: las cuentas las crea el dueño (ver usuarios.md).
Todas las pantallas están protegidas (middleware.js).

### PLAT-2 · Seguridad por filas
Cada tabla guarda `user_id` y tiene la política RLS "solo el dueño". Nunca se
usa la clave secret/service_role, ni en el servidor.

### PLAT-3 · Cambios de la base
El esquema completo vive en `supabase/schema.sql`. Cada cambio a una base que
ya existe va además en un archivo `supabase/cambios/AAAA-MM-DD-tema.sql` que
se puede correr más de una vez y explica qué hace en su primer comentario.

### PLAT-4 · Cálculos puros y probados
Todos los números salen de `lib/calculos.js`: funciones puras que no leen la
base ni la fecha. Tienen pruebas (`npm test`) contra los totales de la planilla.

### PLAT-5 · Acciones que no tiran errores
Cada acción de servidor devuelve `{ error }` en palabras simples en vez de
lanzarlo; el mensaje técnico queda en el registro del servidor. Lo que hace
falta para deshacer viaja junto al ok.

### PLAT-6 · Idioma y moneda
Español rioplatense con voseo, voz cercana y sin jerga. Pesos argentinos con
formato es-AR. Fechas en hora de Argentina.

### PLAT-7 · Celular y computadora
Cada pantalla funciona igual de bien en las dos.

### PLAT-8 · Bambu Lab (opcional)
Con el token de la cuenta, el historial de impresiones entra a una bandeja
("Por revisar"). Desde ahí cada una pasa a ser una impresión de la app, se
suma a una venta o se descarta, todo o nada, y se puede deshacer. Usa la API no
oficial de Bambu Handy: puede dejar de andar.

## Preguntas abiertas
- Ninguna por ahora.
