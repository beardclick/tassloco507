import https from 'node:https';

const req = (method, u, body, cookie) =>
  new Promise((res) => {
    const d = body ? JSON.stringify(body) : null;
    const q = https.request(
      u,
      { method, headers: { ...(d ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) } : {}), ...(cookie ? { Cookie: cookie } : {}) }, timeout: 25000 },
      (r) => {
        let b = '';
        r.on('data', (c) => (b += c));
        r.on('end', () => res({ s: r.statusCode, d: b, sc: r.headers['set-cookie'] }));
      },
    );
    q.on('error', (e) => res({ s: 0, d: 'ERR ' + e.message }));
    q.write(d || '');
    q.end();
  });

const base = 'https://www.tassloco507.com';
const lg = await req('POST', base + '/api/admin/login', { user: 'beardclick@gmail.com', password: 'Tasse42d9732!' });
const cookie = ((lg.sc || [])[0] || '').split(';')[0];
const page = await req('GET', base + '/admin/homepage', null, cookie);
console.log('status', page.s, '| len', page.d.length);
console.log('"Marquee":', (page.d.match(/Marquee/g) || []).length);
console.log('"Contenido del marquee":', (page.d.match(/Contenido del marquee/g) || []).length);
console.log('"Velocidad":', (page.d.match(/Velocidad/g) || []).length);
console.log('"Secciones de categorías":', (page.d.match(/Secciones de categor/g) || []).length);
