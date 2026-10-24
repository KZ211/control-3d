# Control 3D

App personal para llevar las cuentas del emprendimiento de impresión 3D: impresiones con su costo (filamento, luz y desgaste), ventas y cobros, compras y cuotas, la caja, cuánto falta para recuperar la plata invertida y un balance. Incluye una sección **Aprender** que explica cada concepto con tus propios números.

Next.js 14 (App Router), JavaScript, Tailwind CSS y Supabase (base de datos y login).

## Puesta en marcha

1. **Tablas.** En Supabase: SQL Editor > New query, pegá `supabase/schema.sql` y ejecutalo. Si ya habías corrido una versión anterior, corré antes `supabase/reset.sql` (borra las tablas y sus datos).
2. **Tu usuario.** Authentication > Users > Add user > Create new user, con tu email y una contraseña (marcá "Auto Confirm User").
3. **Cerrar el registro.** Authentication > Sign In / Providers: desactivá "Allow new users to sign up". Así nadie más puede crear una cuenta.
4. **Datos de la planilla (opcional).** Pegá y ejecutá `supabase/datos-iniciales.sql`. Carga las tres hojas de "Costos empresa 3D": máquinas y compras (Deuda), las 75 filas de Ventas agrupadas en pedidos por cliente, y la hoja Impresion propia. Al principio del archivo están anotados los supuestos (fechas, cobros pendientes, encargos).
5. **Claves.** Copiá `.env.example` como `.env.local` y completá la URL y la clave publicable (Project Settings > API Keys). Nunca uses la clave secreta / service_role.
6. **Correr la app:**

   ```bash
   npm install
   npm run dev     # http://localhost:3000
   npm test        # pruebas de los cálculos
   ```

## Cómo está armado

```
app/(app)/          una carpeta por sección, cada pestaña es una página:
                    (panel) resumen, mes, balance · ventas nueva, encargos, cobrar,
                    historial, clientes · taller imprimir, impresiones, productos,
                    maquinas · compras nueva, filamento, cuotas, historial ·
                    plata recuperación, caja, bolsillo, reinversion · aprender · ajustes
components/         armazón (menú, pestañas), gráficos y la carga rápida de ventas
app/acciones.js     todo lo que escribe en la base (acciones de servidor)
app/login/          inicio de sesión
lib/calculos.js     todos los números (costos, caja, resultado, balance), con pruebas
lib/datos.js        lee las tablas y las pasa por los cálculos
supabase/           esquema con seguridad por filas y datos iniciales
middleware.js       renueva la sesión y protege todas las pantallas
```

Una venta es un pedido de un cliente con uno o varios renglones (`venta_items`), cada uno opcionalmente de un producto del catálogo. Las impresiones apuntan al renglón que fabrican; si no hay impresiones, el costo del renglón se estima con sus gramos y el precio por gramo, como en la planilla. El esquema completo con sus relaciones está dibujado al principio de `supabase/schema.sql`.

Cada tabla guarda el `user_id` y tiene seguridad por filas (RLS): cada usuario solo ve y modifica lo suyo.

## Publicarla

Se puede subir a Vercel: importá el repo y cargá las dos variables de `.env.local` en Settings > Environment Variables.
