// Migra las imágenes hardcodeadas en el código (logo + hero) a Supabase Storage.
import { createClient } from '@supabase/supabase-js';
import https from 'node:https';
import { createHash } from 'node:crypto';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BUCKET = 'product-images';
const OLD_HOST = '35.237.67.85';

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

const urls = [
  'https://tassloco507.com/wp-content/uploads/2020/06/banner-tass-loco-1-1024x576.jpeg',
  'https://tassloco507.com/wp-content/uploads/2020/07/tass-loco-R-674x800.png',
];

for (const url of urls) {
  try {
    const bytes = await download(url);
    const ext = (url.split('.').pop() || 'jpg').toLowerCase();
    const name = `legacy/${createHash('sha1').update(url).digest('hex')}.${ext}`;
    const { error } = await sb.storage.from(BUCKET).upload(name, bytes, { contentType: `image/${ext}`, upsert: true });
    if (error) throw new Error(error.message);
    const newUrl = sb.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
    console.log(`${url}\n  -> ${newUrl}`);
  } catch (e) {
    console.error(`FALLO ${url}: ${e.message}`);
  }
}
