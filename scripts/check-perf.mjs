const base = 'https://www.tassloco507.com';

async function get(path, tries = 30) {
  for (let i = 0; i < tries; i += 1) {
    const res = await fetch(base + path, { headers: { 'cache-control': 'no-cache' } });
    if (res.status === 200) return { status: res.status, body: await res.text() };
    await new Promise((r) => setTimeout(r, 10000));
  }
  return { status: 0, body: '' };
}

const robots = await fetch(base + '/robots.txt').then((r) => r.text());
console.log('--- robots.txt ---');
console.log(robots);

const map = await get('/sitemap.xml');
const urls = [...map.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
console.log('--- sitemap.xml ---');
console.log('status:', map.status, '| URLs:', urls.length);
console.log('productos:', urls.filter((u) => u.includes('/producto/')).length);
console.log('categorias:', urls.filter((u) => u.includes('/categoria-producto/')).length);
console.log('muestra:', urls.slice(0, 4).join(' | '));

const home = await fetch(base + '/').then(async (r) => ({ s: r.status, cc: r.headers.get('cache-control'), xv: r.headers.get('x-vercel-cache'), b: await r.text() }));
console.log('--- home ---');
console.log('status:', home.s, '| cache-control:', home.cc, '| vercel-cache:', home.xv);
console.log('marquee items:', (home.b.match(/marquee__item/g) || []).length);
