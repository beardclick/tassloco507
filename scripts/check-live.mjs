import https from 'node:https';

const get = (u) =>
  new Promise((res) => {
    https.get(u, { timeout: 25000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => res({ s: r.statusCode, d }));
    }).on('error', (e) => res({ s: 0, d: 'ERR ' + e.message }));
  });

// página de un producto concreto (debería dar 404 si RLS bloquea la lectura)
const r = await get('https://tassloco507.vercel.app/producto/halogenas-honda-civic-99-00');
console.log('producto concreto -> status', r.s, '| len', r.d.length);
console.log('contiene 404:', r.d.includes('404') || r.d.includes('no encontrado'), '| contiene precio:', /B\/\./.test(r.d));
