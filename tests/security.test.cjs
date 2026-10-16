const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { createHmac } = require('node:crypto');

// Ejecuta los módulos TS reales con dobles solo en límites externos (Next/DB).
function load(entry, mocks = {}, cache = new Map()) {
  const filename = path.resolve(entry);
  if (cache.has(filename)) return cache.get(filename).exports;
  const mod = { exports: {} };
  cache.set(filename, mod);
  const js = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const localRequire = spec => {
    if (Object.hasOwn(mocks, spec)) return mocks[spec];
    if (spec === 'server-only') return {};
    if (spec.startsWith('@/')) return load(spec.slice(2) + '.ts', mocks, cache);
    if (spec.startsWith('.')) return load(path.resolve(path.dirname(filename), spec) + '.ts', mocks, cache);
    return require(spec);
  };
  vm.runInThisContext('(function(require,module,exports){' + js + '\n})', { filename })(localRequire, mod, mod.exports);
  return mod.exports;
}
process.env.ADMIN_SECRET = 'A'.repeat(64);
process.env.AUTH_SECRET = 'B'.repeat(64);

test('sesiones: firma, expiración exacta, separación de roles y rotación', () => {
  const { issueToken, validToken, SESSION_TTL } = load('lib/session-token.ts');
  const now = 1_800_000_000_000;
  const token = issueToken('admin', now);
  assert.equal(validToken(token, 'admin', now), true);
  assert.equal(validToken(token, 'customer', now), false);
  assert.equal(validToken(token, 'admin', now - 1), false);
  assert.equal(validToken(token, 'admin', now + SESSION_TTL.admin * 1000), false);
  assert.equal(validToken(token + 'x', 'admin', now), false);
  assert.equal(validToken(token + '.extra', 'admin', now), false);
  process.env.ADMIN_SECRET = 'C'.repeat(64);
  assert.equal(validToken(token, 'admin', now), false);
  process.env.ADMIN_SECRET = 'A'.repeat(64);
});

test('sesiones: rechaza secretos ausentes, débiles y cookies antiguas', () => {
  const { issueToken, validToken } = load('lib/session-token.ts');
  const old = process.env.ADMIN_SECRET;
  delete process.env.ADMIN_SECRET;
  assert.throws(() => issueToken('admin'), /ADMIN_SECRET/);
  process.env.ADMIN_SECRET = 'tassloco507-local-dev-secret';
  assert.throws(() => issueToken('admin'), /ADMIN_SECRET/);
  process.env.ADMIN_SECRET = old;
  const oldPayload = Buffer.from('admin:' + Date.now()).toString('base64url');
  assert.equal(validToken(oldPayload + '.' + createHmac('sha256', old).update(oldPayload).digest('hex'), 'admin'), false);
});

test('cookies: HttpOnly, Secure en producción y vencimiento limitado', () => {
  const { cookieOptions } = load('lib/session-token.ts');
  const old = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  assert.deepEqual(cookieOptions('admin'), { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 28800 });
  process.env.NODE_ENV = old;
});

test('autorización: un usuario normal o user_metadata.role no es administrador', () => {
  const { isAuthorizedAuthAdmin } = load('lib/supabase-admin-auth.ts', { '@supabase/supabase-js': {} });
  const old = process.env.SUPABASE_ADMIN_EMAILS;
  process.env.SUPABASE_ADMIN_EMAILS = '';
  const user = { email: 'user@example.com', email_confirmed_at: '2026-01-01', app_metadata: {}, user_metadata: { role: 'admin' } };
  assert.equal(isAuthorizedAuthAdmin(user), false);
  assert.equal(isAuthorizedAuthAdmin({ ...user, app_metadata: { role: 'admin' } }), true);
  assert.equal(isAuthorizedAuthAdmin({ ...user, app_metadata: { role: 'admin' }, email_confirmed_at: null }), false);
  assert.equal(isAuthorizedAuthAdmin({ ...user, app_metadata: { role: 'admin' }, banned_until: '2999-01-01' }), false);
  process.env.SUPABASE_ADMIN_EMAILS = 'USER@example.com';
  assert.equal(isAuthorizedAuthAdmin(user), true);
  if (old === undefined) delete process.env.SUPABASE_ADMIN_EMAILS; else process.env.SUPABASE_ADMIN_EMAILS = old;
});

test('cliente de autenticación independiente y sin persistencia', () => {
  let options;
  const { createAdminAuthClient } = load('lib/supabase-admin-auth.ts', {
    '@supabase/supabase-js': { createClient: (...args) => { options = args[2]; return {}; } },
  });
  createAdminAuthClient();
  assert.deepEqual(options.auth, { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false });
});

test('login admin no emite sesión para un usuario Auth sin autorización', async () => {
  let created = false;
  const { loginAdmin } = load('lib/auth.ts', {
    'next/headers': {},
    './db': { getAdminByEmail: async () => null },
    './password': {},
    './sessions': { createSession: () => { created = true; } },
    './supabase': { getSupabase: () => { throw new Error('No usar service_role para login'); } },
    './supabase-admin-auth': {
      createAdminAuthClient: () => ({ auth: { signInWithPassword: async () => ({ data: { user: { id: 'regular' } }, error: null }) } }),
      isAuthorizedAuthAdmin: () => false,
    },
  });
  assert.equal(await loginAdmin('regular@example.com', 'password'), null);
  assert.equal(created, false);
});

test('verificación de admin invalida cuenta eliminada o contraseña cambiada', async () => {
  let admin = { email: 'admin@example.com', passwordHash: 'new-hash' };
  const { verifyToken } = load('lib/auth.ts', {
    'next/headers': {},
    './db': { getAdminById: async () => admin },
    './password': {}, './supabase': {}, './supabase-admin-auth': {},
    './sessions': { readSession: async () => ({ subject_id: 'db:1', identity: 'admin@example.com', credential_version: 'old-hash' }), credentialVersion: value => value },
  });
  assert.equal(await verifyToken('token'), null);
  admin.passwordHash = 'old-hash';
  assert.equal(await verifyToken('token'), 'admin@example.com');
  admin = null;
  assert.equal(await verifyToken('token'), null);
});

test('logout elimina el token del almacén; su reproducción deja de funcionar', async () => {
  const rows = new Map();
  const db = { from: () => ({
    insert: async row => { rows.set(row.token_hash, row); return { error: null }; },
    select: () => {
      let hash;
      const query = { eq: (key, value) => { if (key === 'token_hash') hash = value; return query; }, gt: () => query,
        maybeSingle: async () => ({ data: rows.get(hash) ?? null, error: null }) };
      return query;
    },
    delete: () => {
      let hash;
      const query = { eq: (key, value) => { if (key === 'token_hash') hash = value; return query; },
        then: resolve => { rows.delete(hash); return Promise.resolve({ error: null }).then(resolve); } };
      return query;
    },
  }) };
  const sessions = load('lib/sessions.ts', { './supabase': { getSupabase: () => db } });
  const token = await sessions.createSession({ kind: 'admin', subject_id: 'db:1', identity: 'admin@example.com', credential_version: 'v' });
  assert.ok(await sessions.readSession(token, 'admin'));
  assert.equal([...rows.values()][0].token_hash.includes(token), false);
  await sessions.revokeSession(token, 'admin');
  assert.equal(await sessions.readSession(token, 'admin'), null);
});

const product = { slug: 'part', name: 'Real product', draft: false, in_stock: true, prices: { price: '1234', currency_minor_unit: 2, currency_code: 'USD' }, categories: [], images: [{ src: 'real.jpg' }] };

test('checkout ignora precio, nombre e imagen manipulados y suma centavos', async () => {
  const { priceCheckoutItems } = load('lib/checkout-security.ts');
  const result = await priceCheckoutItems([{ slug: 'part', qty: 3, price: -100, name: 'forged', image: 'evil' }], async () => product);
  assert.equal(result.subtotal, 37.02);
  assert.deepEqual(result.items[0], { slug: 'part', qty: 3, price: 12.34, name: 'Real product', image: 'real.jpg' });
});

test('checkout rechaza cantidades inválidas, duplicados excesivos y listas grandes', async () => {
  const { priceCheckoutItems } = load('lib/checkout-security.ts');
  for (const qty of [0, -1, 1.5, NaN, Infinity, 100, '2']) {
    await assert.rejects(priceCheckoutItems([{ slug: 'part', qty }], async () => product));
  }
  await assert.rejects(priceCheckoutItems([{ slug: 'part', qty: 60 }, { slug: 'part', qty: 60 }], async () => product));
  await assert.rejects(priceCheckoutItems(Array(51).fill({ slug: 'part', qty: 1 }), async () => product));
});

test('checkout rechaza borradores, agotados, cotizaciones y productos inexistentes', async () => {
  const { priceCheckoutItems } = load('lib/checkout-security.ts');
  for (const candidate of [undefined, { ...product, draft: true }, { ...product, in_stock: false }, { ...product, quoteOnly: true },
    { ...product, hidePrice: true }, { ...product, categories: [{ slug: 'pedido-especial' }] },
    { ...product, prices: { ...product.prices, price: '-1' } }]) {
    await assert.rejects(priceCheckoutItems([{ slug: 'part', qty: 1 }], async () => candidate));
  }
});

test('origen: permite mismo sitio y bloquea CSRF, origen ausente y null', () => {
  const { isTrustedMutation } = load('lib/request-origin.ts');
  const old = process.env.APP_ORIGIN;
  delete process.env.APP_ORIGIN;
  assert.equal(isTrustedMutation(new Request('https://shop.example/api/orders', { method: 'POST', headers: { origin: 'https://shop.example' } })), true);
  for (const origin of ['https://evil.example', 'null', 'https://shop.example.evil.com']) {
    assert.equal(isTrustedMutation(new Request('https://shop.example/api/orders', { method: 'POST', headers: { origin } })), false);
  }
  assert.equal(isTrustedMutation(new Request('https://shop.example/api/orders', { method: 'POST' })), false);
  assert.equal(isTrustedMutation(new Request('https://shop.example/api/orders')), true);
  if (old !== undefined) process.env.APP_ORIGIN = old;
});

test('JSON: límites de tamaño sin Content-Length, objetos y MIME', async () => {
  const { readJsonObject } = load('lib/request-security.ts');
  const request = body => new Request('https://shop.example', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
  assert.deepEqual(await readJsonObject(request('{"ok":true}')), { ok: true });
  for (const body of ['null', '[]', '{']) await assert.rejects(readJsonObject(request(body)), error => error.status === 400);
  await assert.rejects(readJsonObject(request('{"x":"' + 'a'.repeat(40) + '"}'), 20), error => error.status === 413);
  await assert.rejects(readJsonObject(new Request('https://shop.example', { method: 'POST', body: '{}' })), error => error.status === 415);
});

test('rate limit: 429 con Retry-After, identidad cifrada y fallo cerrado', async () => {
  let response = { data: { allowed: false, retry_after: 120 }, error: null };
  let args;
  const { enforceRateLimit } = load('lib/rate-limit.ts', { './supabase': { getSupabase: () => ({
    rpc: async (_name, params) => { args = params; return response; },
  }) } });
  const result = await enforceRateLimit(new Request('https://shop.example'), 'login', 5, 900, 'person@example.com');
  assert.equal(result.status, 429);
  assert.equal(result.headers.get('Retry-After'), '120');
  assert.match(args.p_key, /^[a-f0-9]{64}$/);
  assert.equal(args.p_key.includes('person'), false);
  response = { data: null, error: { code: 'unavailable' } };
  await assert.rejects(enforceRateLimit(new Request('https://shop.example'), 'login', 5, 900));
});

test('rate limit: cabecera IP no confiable no permite eludir el contador', async () => {
  const oldVercel = process.env.VERCEL;
  const oldProxy = process.env.TRUST_PROXY;
  delete process.env.VERCEL; delete process.env.TRUST_PROXY;
  const keys = [];
  const { enforceRateLimit } = load('lib/rate-limit.ts', { './supabase': { getSupabase: () => ({
    rpc: async (_name, params) => { keys.push(params.p_key); return { data: { allowed: true }, error: null }; },
  }) } });
  for (const ip of ['1.1.1.1', '2.2.2.2']) {
    await enforceRateLimit(new Request('https://shop.example', { headers: { 'x-forwarded-for': ip } }), 'login', 5, 900);
  }
  assert.equal(keys[0], keys[1]);
  if (oldVercel !== undefined) process.env.VERCEL = oldVercel;
  if (oldProxy !== undefined) process.env.TRUST_PROXY = oldProxy;
});

test('health no consulta la base, no escribe ni revela configuración', async () => {
  const { GET } = load('app/api/health/route.ts');
  const res = await GET();
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
});

test('imágenes: rechaza SVG/HTML falsificado y detecta PNG por contenido', () => {
  const { detectImage } = load('lib/image-upload.ts');
  assert.equal(detectImage(Buffer.from('<svg onload="alert(1)"></svg>')), null);
  assert.equal(detectImage(Buffer.from('<html>evil</html>')), null);
  const png = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), Buffer.alloc(20)]);
  assert.deepEqual(detectImage(png), { extension: 'png', contentType: 'image/png' });
});

test('pedido manipulado: total proviene del catálogo y propiedad del cliente autenticado', async () => {
  let saved;
  const { POST } = load('app/api/orders/route.ts', {
    '@/lib/db': { getProductBySlug: async () => product, getCustomerByEmail: async () => ({ id: 7 }), createOrder: async order => { saved = order; return { ...order, id: 'order' }; } },
    '@/lib/email': { sendOrderEmails: async () => {} },
    '@/lib/customer-auth': { currentCustomer: async () => ({ id: 7, email: 'person@example.com' }) },
    '@/lib/password': {}, '@/lib/session-token': {},
    '@/lib/rate-limit': { enforceRateLimit: async () => null },
  });
  const res = await POST(new Request('https://shop.example/api/orders', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
    customer: { nombre: 'Person', email: 'person@example.com', telefono: '60000000' },
    delivery: { method: 'recoger' }, payment: { method: 'efectivo' },
    items: [{ slug: 'part', qty: 2, price: 0.01 }], subtotal: 0.02, customerId: 999,
  }) }));
  assert.equal(res.status, 200);
  assert.equal(saved.total, 24.68);
  assert.equal(saved.customerId, 7);
});

test('Mi cuenta consulta pedidos por customer_id, sin heredar los de otro correo', async () => {
  let filter;
  const { getOrdersForCustomer } = load('lib/db.ts', {
    './supabase': { getSupabase: () => ({ from: () => ({ select: () => ({ eq: (key, value) => {
      filter = [key, value]; return { order: async () => ({ data: [], error: null }) };
    } }) }) }) },
    './product-meta': {}, './supabase-admin-auth': {}, './sessions': {},
  });
  await getOrdersForCustomer(7);
  assert.deepEqual(filter, ['customer_id', 7]);
});

test('notificaciones: conserva otras preferencias y excluye al administrador desactivado', async () => {
  let stored = { disabled: ['other@example.com'] };
  const settings = load('lib/notification-settings.ts', {
    './supabase': { PRIVATE_STORAGE_BUCKET: 'server-settings', getSupabase: () => ({ storage: { from: () => ({
      download: async () => ({ data: new Blob([JSON.stringify(stored)]), error: null }),
      upload: async (_path, value) => { stored = JSON.parse(value); return { error: null }; },
    }) } }) },
    './db': { getAdmins: async () => [{ email: 'other@example.com' }, { email: 'target@example.com' }], getSupabaseAuthUsers: async () => [{ email: 'active@example.com' }] },
  });
  const oldUrl = process.env.SUPABASE_URL, oldKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  try {
    await settings.setNotificationDisabled('TARGET@example.com', true);
    assert.deepEqual(stored.disabled, ['other@example.com', 'target@example.com']);
    assert.deepEqual(await settings.getOrderNotificationEmails(), ['active@example.com']);
    await settings.setNotificationDisabled('target@example.com', false);
    assert.deepEqual(stored.disabled, ['other@example.com']);
  } finally {
    if (oldUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = oldKey;
  }
});

test('notificaciones: un fallo de lectura no sobrescribe las preferencias existentes', async () => {
  let writes = 0;
  const settings = load('lib/notification-settings.ts', {
    './supabase': { PRIVATE_STORAGE_BUCKET: 'server-settings', getSupabase: () => ({ storage: { from: () => ({
      download: async () => ({ data: null, error: { message: 'network unavailable' } }),
      upload: async () => { writes++; return { error: null }; },
    }) } }) },
    './db': {},
  });
  const oldUrl = process.env.SUPABASE_URL, oldKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_URL = 'https://example.supabase.co'; process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  try {
    await assert.rejects(settings.setNotificationDisabled('target@example.com', true));
    assert.equal(writes, 0);
  } finally {
    if (oldUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = oldKey;
  }
});

test('API notificaciones: exige administrador, booleano real y destinatario autorizado', async () => {
  let authorized = false;
  const writes = [];
  const { PUT } = load('app/api/admin/admin-notifications/route.ts', {
    '@/lib/auth': { isAdminRequest: async () => authorized },
    '@/lib/notification-settings': {
      getAllAdminEmails: async () => ['target@example.com'],
      setNotificationDisabled: async (...args) => writes.push(args),
    },
  });
  const request = body => new Request('https://shop.example/api/admin/admin-notifications', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal((await PUT(request({ email: 'target@example.com', disabled: true }))).status, 401);
  authorized = true;
  assert.equal((await PUT(request({ email: 'target@example.com', disabled: 'false' }))).status, 400);
  assert.equal((await PUT(request({ email: 'stranger@example.com', disabled: true }))).status, 404);
  assert.deepEqual(writes, []);
  const result = await PUT(request({ email: 'TARGET@example.com', disabled: true }));
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { ok: true });
  assert.deepEqual(writes, [['target@example.com', true]]);
});
