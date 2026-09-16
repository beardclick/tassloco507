// Diagnostica el estado de la base de datos de Supabase.
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const sb = createClient(url, key);

for (const t of ['products', 'categories', 'orders', 'customers']) {
  const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true });
  if (error) {
    console.log(`${t}: ERROR -> ${error.message} (code ${error.code})`);
  } else {
    console.log(`${t}: OK — ${count} filas`);
  }
}

const { data: buckets, error: be } = await sb.storage.listBuckets();
if (be) {
  console.log('storage buckets: ERROR ->', be.message);
} else {
  console.log('storage buckets:', (buckets ?? []).map((b) => `${b.name}(${b.public ? 'público' : 'privado'})`).join(', ') || '(ninguno)');
}
