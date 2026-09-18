// Diagnóstico: cuántas imágenes externas hay y si el servidor viejo sigue accesible.
import { createClient } from '@supabase/supabase-js';
import https from 'node:https';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: products } = await sb.from('products').select('id, images, categories');
const { data: categories } = await sb.from('categories').select('id, image');

const urls = new Set();
for (const p of products ?? []) {
  for (const img of p.images ?? []) urls.add(img.src);
}
for (const c of categories ?? []) {
  if (c.image) urls.add(c.image);
}

const external = [...urls].filter((u) => u.includes('tassloco507.com'));
console.log('Productos:', (products ?? []).length);
console.log('Imágenes únicas totales:', urls.size);
console.log('Imágenes externas (tassloco507.com):', external.length);

// Probar acceso al servidor viejo por IP + Host header.
if (external.length > 0) {
  const sample = external[0];
  await new Promise((res) => {
    const req = https.get(
      { host: '35.237.67.85', path: new URL(sample).pathname, headers: { Host: 'tassloco507.com' }, rejectUnauthorized: false, timeout: 15000 },
      (r) => {
        console.log('Servidor viejo (IP 35.237.67.85): status', r.statusCode, 'para', sample);
        res();
      },
    );
    req.on('error', (e) => { console.log('Servidor viejo error:', e.message); res(); });
  });
}
