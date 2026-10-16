import { createClient } from '@supabase/supabase-js';
import nextEnv from '@next/env';
import { readFile } from 'node:fs/promises';
nextEnv.loadEnvConfig(process.cwd());

const cleanup = process.argv.includes('--cleanup');
const apply = process.argv.includes('--apply') || cleanup;
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(15000) }) },
});
function fail(message) { console.error(message); process.exit(1); }

// No imprime claves, contenidos de configuración ni datos de clientes.
const { error: tableError } = await sb.from('security_sessions').select('token_hash', { head: true }).limit(0);
const { error: columnError } = await sb.from('orders').select('customer_id', { head: true }).limit(0);
if (tableError || columnError) fail('No se pudo verificar la migración 202610150002_app_security.sql. Ejecuta el SQL y comprueba la conexión.');
const { data: buckets, error: bucketError } = await sb.storage.listBuckets();
if (bucketError || !buckets.some(bucket => bucket.id === 'server-settings' && !bucket.public)) fail('Falta el bucket privado server-settings.');

for (const name of ['homepage.json', 'product-meta.json', 'notification-prefs.json']) {
  const path = `settings/${name}`;
  const { data: current, error: currentError } = await sb.storage.from('server-settings').download(path);
  if (currentError && !['404', '400'].includes(String(currentError.statusCode))) fail(`No se pudo comprobar ${name} en el bucket privado.`);
  const { data: legacy, error: legacyError } = await sb.storage.from('product-images').download(path);
  if (legacyError && !['404', '400'].includes(String(legacyError.statusCode))) fail(`No se pudo leer ${name} del bucket anterior.`);
  // Mantener el destino existente; no sobrescribir configuraciones más recientes.
  let source = legacy;
  if (!current && !source) {
    const local = name === 'homepage.json' ? 'data/homepage.json' : `data/${name}`;
    try { source = new Blob([await readFile(local)], { type: 'application/json' }); } catch {}
  }
  if (!current && !source && ['product-meta.json', 'notification-prefs.json'].includes(name)) {
    source = new Blob([name === 'product-meta.json' ? '{}' : '{"disabled":[]}'], { type: 'application/json' });
  }
  console.log(`${name}: ${current ? 'privado existente' : source ? 'pendiente de copiar al bucket privado' : 'sin configuración previa'}`);
  if (!apply) continue;
  if (!current && source) {
    const text = await source.text();
    JSON.parse(text);
    const { error } = await sb.storage.from('server-settings').upload(path, text, { contentType: 'application/json', upsert: false, cacheControl: '0' });
    if (error) fail(`No se pudo copiar ${name}; se conserva el original.`);
    const { data: verified, error: verifyError } = await sb.storage.from('server-settings').download(path);
    if (verifyError || !verified || await verified.text() !== text) fail(`No se pudo verificar ${name}; se conserva el original.`);
  }
  if (legacy && cleanup) {
    // Conservar además una copia privada exacta del original antes de retirarlo del bucket público.
    const original = await legacy.text();
    const backupPath = `legacy/${name}`;
    const { data: backup, error: backupReadError } = await sb.storage.from('server-settings').download(backupPath);
    if (backupReadError && !['404', '400'].includes(String(backupReadError.statusCode))) fail(`No se pudo comprobar el respaldo de ${name}.`);
    if (!backup || await backup.text() !== original) {
      const { error } = await sb.storage.from('server-settings').upload(backupPath, original, { contentType: 'application/json', upsert: true, cacheControl: '0' });
      if (error) fail(`No se pudo respaldar ${name}; se conserva el original público.`);
    }
    const { data: confirmed, error: confirmError } = await sb.storage.from('server-settings').download(backupPath);
    if (confirmError || !confirmed || await confirmed.text() !== original) fail(`No se pudo verificar el respaldo de ${name}.`);
    const { error } = await sb.storage.from('product-images').remove([path]);
    if (error) fail(`La copia privada existe, pero falta retirar ${name} del bucket público.`);
  }
}
console.log(cleanup ? 'Configuración privada verificada y originales públicos retirados.'
  : apply ? 'Configuración privada copiada y verificada. Después del despliegue, usa --cleanup para respaldar y retirar los originales públicos.'
  : 'Revisión completada. Usa --apply para copiar y verificar; después del despliegue, --cleanup para retirar los originales públicos.');
