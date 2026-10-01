import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const sb = createClient(process.env.U, process.env.SR);
const BUCKET = 'product-images';

// 1) Config actual en Storage (tiene el versículo del marquee y secciones nuevas).
const { data: current, error: dlErr } = await sb.storage.from(BUCKET).download('settings/homepage.json');
if (dlErr) { console.log('ERROR download:', dlErr.message); process.exit(1); }
const currentSettings = JSON.parse(await current.text());

// 2) Tu versión personalizada (banner propio + sin "Racing").
const custom = JSON.parse(readFileSync('data/homepage.json', 'utf8'));

// 3) Restaurar solo lo que se perdió: banner + textos sin "Racing".
const merged = {
  ...currentSettings,
  heroImage: custom.heroImage,
  tagline: custom.tagline,
  description: custom.description,
  stickers: custom.stickers,
};

const { error: upErr } = await sb.storage.from(BUCKET).upload(
  'settings/homepage.json',
  JSON.stringify(merged),
  { upsert: true, contentType: 'application/json', cacheControl: '0' },
);
if (upErr) { console.log('ERROR upload:', upErr.message); process.exit(1); }

console.log('OK — restaurado:');
console.log('  heroImage:', merged.heroImage);
console.log('  tagline:', merged.tagline);
console.log('  description:', merged.description);
console.log('  stickers:', JSON.stringify(merged.stickers));
console.log('  marqueeItems (mantenido):', JSON.stringify(merged.marqueeItems));
console.log('  marqueeSpeed:', merged.marqueeSpeedDesktop, '/', merged.marqueeSpeedMobile);
