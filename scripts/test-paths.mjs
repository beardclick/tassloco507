import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.U, process.env.SR, { auth: { persistSession: false } });

for (const p of ['settings/_health-test.json', 'settings/notification-prefs.json', 'settings/product-meta.json', 'settings/homepage.json']) {
  const { error } = await sb.storage.from('product-images').upload(
    p,
    JSON.stringify({ t: Date.now() }),
    { upsert: true, contentType: 'application/json', cacheControl: '0' },
  );
  console.log(`${p} -> ${error ? 'ERR ' + error.message : 'OK'}`);
}
