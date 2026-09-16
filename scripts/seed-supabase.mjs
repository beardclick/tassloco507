// Siembra el catálogo (productos + categorías) en Supabase.
// Requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.
// Ejecutar:  node scripts/seed-supabase.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Faltan las variables SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const sb = createClient(url, key);
const products = JSON.parse(readFileSync(new URL('../data/products.json', import.meta.url), 'utf8'));
const categories = JSON.parse(readFileSync(new URL('../data/categories.json', import.meta.url), 'utf8'));

const { error: ce } = await sb.from('categories').upsert(categories);
if (ce) console.error('Error en categorías:', ce.message);
else console.log(`Categorías: ${categories.length}`);

const CHUNK = 200;
for (let i = 0; i < products.length; i += CHUNK) {
  const chunk = products.slice(i, i + CHUNK);
  const { error } = await sb.from('products').upsert(chunk);
  if (error) console.error(`Error en productos (${i}):`, error.message);
  else console.log(`Productos: ${i + chunk.length}/${products.length}`);
}

console.log('✅ Seed completo.');
