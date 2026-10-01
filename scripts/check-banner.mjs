import https from 'node:https';

const img = 'https://adgmizcnlusgxbflengu.supabase.co/storage/v1/object/public/product-images/1789571556278-c2114912.jpeg';
const res = await new Promise((r) => {
  https.get(img, { timeout: 20000 }, (resp) => {
    let d = '';
    resp.on('data', (c) => (d += c));
    resp.on('end', () => r({ s: resp.statusCode, len: d.length }));
  }).on('error', (e) => r({ s: 0, len: 0, err: e.message }));
});
console.log('banner custom status:', res.s, '| bytes:', res.len, res.err ? '| ' + res.err : '');
