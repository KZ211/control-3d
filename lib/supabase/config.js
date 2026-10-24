// Datos públicos del proyecto de Supabase (.env.local). La seguridad la dan
// el login y las reglas por fila de schema.sql, no esta clave.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function revisarConfig() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.local (mirá .env.example).');
  }
}
