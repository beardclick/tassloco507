import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const STORAGE_BUCKET = 'product-images';

let _client: SupabaseClient | null = null;

// Solo para uso en servidor (API routes / server components).
// Usa la service role key para CRUD completo; NO exponer al cliente.
export function getSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Faltan las variables SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY. Configúralas en .env.local o en Vercel.',
    );
  }
  if (!_client) _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}
