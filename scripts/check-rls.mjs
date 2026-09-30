import { createClient } from '@supabase/supabase-js';

const U = process.env.U;
const SR = process.env.SR;
const ANON = process.env.ANON;

const sr = createClient(U, SR);
const an = createClient(U, ANON);

// 1) Lectura de productos
const { count: srCount } = await sr.from('products').select('*', { count: 'exact', head: true });
const { count: anCount, error: anErr } = await an.from('products').select('*', { count: 'exact', head: true });
console.log('products count | service_role:', srCount, '| anon:', anCount, anErr ? 'ERR ' + anErr.message : '');

// 2) Escritura en Storage (product-images bucket)
async function storageWrite(client, label) {
  const { error } = await client.storage.from('product-images').upload(
    'settings/_test.json',
    JSON.stringify({ t: Date.now() }),
    { upsert: true, contentType: 'application/json' },
  );
  console.log('storage write', label, '->', error ? 'ERR ' + error.message : 'OK');
}
await storageWrite(sr, 'service_role');
await storageWrite(an, 'anon');
