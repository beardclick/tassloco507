import https from 'node:https';

const get = (u) =>
  new Promise((res) => {
    https.get(u, { timeout: 25000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => res({ s: r.statusCode, d }));
    }).on('error', (e) => res({ s: 0, d: 'ERR ' + e.message }));
  });

const r = await get('https://www.tassloco507.com/');
const marquee = (r.d.match(/marquee/g) || []).length;
const items = (r.d.match(/marquee__item/g) || []).length;
const fashion = (r.d.match(/FASHION/g) || []).length;
const car = (r.d.match(/>CAR</g) || []).length;
console.log('status', r.s, '| len', r.d.length);
console.log('"marquee" apariciones:', marquee, '| items:', items, '| FASHION:', fashion, '| >CAR<:', car);
