import { createClient } from '@supabase/supabase-js';

const U = process.env.U;
const SR = process.env.SR;

// Reproduce EXACTLY the production client setup: with persistSession: false.
const sb = createClient(U, SR, { auth: { persistSession: false } });

const { error } = await sb.storage.from('product-images').upload(
  'settings/_prod-sim.json',
  JSON.stringify({ t: Date.now() }),
  { upsert: true, contentType: 'application/json' },
);
console.log('storage write (persistSession:false) ->', error ? 'ERR ' + error.message : 'OK');

const { data: buckets, error: bErr } = await sb.storage.listBuckets();
console.log('listBuckets ->', bErr ? 'ERR ' + bErr.message : JSON.stringify(buckets?.map((b) => b.name)));
