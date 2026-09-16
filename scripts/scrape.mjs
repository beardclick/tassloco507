// Scrape full Tass Loco 507 catalog from the public WooCommerce Store API.
// Outputs: data/products.json and data/categories.json
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'https://tassloco507.com';

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      rejectUnauthorized: false,
      timeout: 30000,
      headers: { 'User-Agent': 'Mozilla/5.0 (TassLoco redesign importer)' },
    }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve({ status: res.statusCode, body: d, headers: res.headers }));
    }).on('error', reject);
  });
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanHtml(html) {
  if (!html) return '';
  return html
    .replace(/\s+data-[a-z-]+="[^"]*"/gi, '')
    .replace(/\s+class="[^"]*"/gi, '')
    .trim();
}

async function main() {
  // Categories
  const catRes = await get(`${BASE}/wp-json/wc/store/v1/products/categories?per_page=100`);
  const categories = JSON.parse(catRes.body).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    parent: c.parent,
    count: c.count,
    description: c.description || '',
    link: c.permalink,
    image: c.image ? c.image.src : null,
  }));

  // Products (paginated)
  let page = 1;
  const products = [];
  let total = 0;
  while (true) {
    const url = `${BASE}/wp-json/wc/store/v1/products?per_page=100&page=${page}`;
    const res = await get(url);
    if (res.status !== 200) {
      console.error(`page ${page}: status ${res.status}`);
      break;
    }
    const batch = JSON.parse(res.body);
    if (!Array.isArray(batch) || batch.length === 0) break;
    total = Number(res.headers['x-wp-total'] || 0);
    for (const p of batch) {
      products.push({
        id: p.id,
        name: p.name,
        slug: p.slug,
        type: p.type,
        permalink: p.permalink,
        on_sale: p.on_sale,
        in_stock: p.is_in_stock,
        prices: p.prices,
        price_html: p.price_html,
        sku: p.sku || '',
        short_description: stripHtml(p.short_description),
        description: cleanHtml(p.description),
        images: (p.images || []).map((i) => ({
          src: i.src,
          thumbnail: i.thumbnail || i.src,
          alt: i.alt || '',
        })),
        categories: (p.categories || []).map((c) => ({
          id: c.id, name: c.name, slug: c.slug, link: c.link,
        })),
        tags: (p.tags || []).map((t) => t.name),
      });
    }
    console.log(`page ${page}: ${batch.length} products (total so far ${products.length}/${total})`);
    if (products.length >= total) break;
    page += 1;
    if (page > 50) break;
  }

  const dataDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, 'products.json'), JSON.stringify(products, null, 1), 'utf8');
  fs.writeFileSync(path.join(dataDir, 'categories.json'), JSON.stringify(categories, null, 1), 'utf8');
  console.log(`DONE: ${products.length} products, ${categories.length} categories -> data/`);
}

main().catch((e) => { console.error(e); process.exit(1); });
