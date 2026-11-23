import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.U, process.env.SR);
const BUCKET = 'product-images';

// 1) Tabla de productos: total y los más recientes (id alto).
const { count } = await sb.from('products').select('*', { count: 'exact', head: true });
const { data: recent } = await sb.from('products').select('id, name').order('id', { ascending: false }).limit(8);
console.log('Total productos en tabla:', count);
console.log('Más recientes (id alto):');
for (const p of recent ?? []) console.log(`  id ${p.id} — ${p.name}`);

// 2) Metadatos (draft/quoteOnly/hidePrice) en Storage.
const { data: metaData, error: metaErr } = await sb.storage.from(BUCKET).download('settings/product-meta.json');
if (metaErr) {
  console.log('product-meta: ERROR', metaErr.message);
} else {
  const meta = JSON.parse(await metaData.text());
  const keys = Object.keys(meta);
  console.log('Entradas en product-meta:', keys.length);
  console.log('IDs meta (muestra):', keys.slice(0, 10).join(', '), '…');
}
