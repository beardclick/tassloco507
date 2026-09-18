// Migra las imágenes hotlinkeadas desde el WordPress viejo a Supabase Storage.
// 1) descarga de 35.237.67.85 (Host: tassloco507.com), 2) sube a Storage, 3) actualiza productos/categorías/homepage.
import { createClient } from '@supabase/supabase-js';
import https from 'node:https';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BUCKET = 'product-images';
const OLD_HOST = '35.237.67.85';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function download(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.get(
      { host: OLD_HOST, path: u.pathname + u.search, headers: { Host: 'tassloco507.com' }, rejectUnauthorized: false, timeout: 30000 },
      (res) => {
        if (res.statusCode !== 200) { res.resume(); reject(new Error(`HTTP ${res.statusCode}`)); return; }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      },
    );
    req.on('error', reject);
  });
}

function extOf(url) {
  const m = new URL(url).pathname.match(/\.([a-z0-9]{2,5})$/i);
  return m ? m[1].toLowerCase() : 'jpg';
}

function nameFor(url) {
  return `legacy/${createHash('sha1').update(url).digest('hex')}.${extOf(url)}`;
}

async function migrate(url, map, stats) {
  if (map.has(url)) return map.get(url);
  if (!url.includes('tassloco507.com')) { map.set(url, url); return url; }
  try {
    const bytes = await download(url);
    const name = nameFor(url);
    const { error } = await sb.storage.from(BUCKET).upload(name, bytes, {
      contentType: `image/${extOf(url)}`,
      upsert: true,
    });
    if (error) throw new Error(error.message);
    const newUrl = sb.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
    map.set(url, newUrl);
    stats.done += 1;
    if (stats.done % 25 === 0) console.log(`... ${stats.done}/${stats.total} migradas`);
    return newUrl;
  } catch (e) {
    console.error(`FALLO: ${url} -> ${e.message}`);
    stats.failed += 1;
    map.set(url, url);
    return url;
  }
}

// ---- 1. Recolectar URLs ----
const { data: products } = await sb.from('products').select('id, images');
const { data: categories } = await sb.from('categories').select('id, image');

const urls = new Set();
for (const p of products ?? []) {
  for (const img of p.images ?? []) {
    if (img.src) urls.add(img.src);
    if (img.thumbnail) urls.add(img.thumbnail);
  }
}
for (const c of categories ?? []) {
  if (c.image) urls.add(c.image);
}

// Homepage hero
let homepage = null;
let homepageFile = null;
try {
  const { data, error } = await sb.storage.from(BUCKET).download('settings/homepage.json');
  if (!error && data) {
    homepageFile = data;
    homepage = JSON.parse(await data.text());
    if (homepage.heroImage) urls.add(homepage.heroImage);
  }
} catch {}

const external = [...urls].filter((u) => u.includes('tassloco507.com'));
console.log(`Total URLs únicas: ${urls.size}, externas a migrar: ${external.length}`);

// ---- 2. Migrar ----
const map = new Map();
const stats = { done: 0, failed: 0, total: external.length };
for (const u of external) {
  await migrate(u, map, stats);
  await sleep(40);
}
console.log(`Migradas: ${stats.done}, fallidas: ${stats.failed}`);

// ---- 3. Actualizar productos ----
let updatedProducts = 0;
for (const p of products ?? []) {
  let changed = false;
  const newImages = (p.images ?? []).map((img) => {
    const src = map.get(img.src) ?? img.src;
    const thumb = map.get(img.thumbnail) ?? img.thumbnail;
    if (src !== img.src || thumb !== img.thumbnail) changed = true;
    return { ...img, src, thumbnail: thumb };
  });
  if (changed) {
    await sb.from('products').update({ images: newImages }).eq('id', p.id);
    updatedProducts += 1;
  }
}
console.log(`Productos actualizados: ${updatedProducts}`);

// ---- 4. Actualizar categorías ----
let updatedCategories = 0;
for (const c of categories ?? []) {
  const newImg = map.get(c.image) ?? c.image;
  if (newImg !== c.image) {
    await sb.from('categories').update({ image: newImg }).eq('id', c.id);
    updatedCategories += 1;
  }
}
console.log(`Categorías actualizadas: ${updatedCategories}`);

// ---- 5. Actualizar homepage ----
if (homepage && homepage.heroImage) {
  const newHero = map.get(homepage.heroImage) ?? homepage.heroImage;
  if (newHero !== homepage.heroImage) {
    homepage.heroImage = newHero;
    const { error } = await sb.storage.from(BUCKET).upload('settings/homepage.json', JSON.stringify(homepage), {
      upsert: true, contentType: 'application/json', cacheControl: '0',
    });
    console.log('Homepage hero actualizado', error ? `ERROR ${error.message}` : 'OK');
  }
}

// ---- Guardar mapeo ----
writeFileSync('data/image-map.json', JSON.stringify([...map.entries()], null, 2));
console.log('✅ Migración completa. Mapeo guardado en data/image-map.json');
