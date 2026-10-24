import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_KEY, revisarConfig } from './config';

// Cliente de Supabase para componentes de servidor y acciones, con la sesión
// guardada en cookies.
export function createClient() {
  revisarConfig();
  const store = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(lista) {
        try {
          lista.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Desde un componente de servidor no se pueden escribir cookies; el
          // middleware ya renueva la sesión.
        }
      },
    },
  });
}
