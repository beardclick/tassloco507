// Cambia la contraseña de un usuario de Supabase Auth usando la service role key.
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const email = (process.env.TARGET_EMAIL || 'beardclick@gmail.com').trim().toLowerCase();

const { data, error } = await sb.auth.admin.listUsers();
if (error) {
  console.error('Error listando usuarios:', error.message);
  process.exit(1);
}
const user = (data.users ?? []).find((u) => (u.email ?? '').toLowerCase() === email);
if (!user) {
  console.error('No se encontró el usuario', email);
  process.exit(1);
}

const newPassword = `Tass${randomBytes(4).toString('hex')}!`;
const { data: updated, error: upErr } = await sb.auth.admin.updateUserById(user.id, {
  password: newPassword,
});
if (upErr) {
  console.error('Error actualizando:', upErr.message);
  process.exit(1);
}
console.log('OK — usuario:', updated.user.email);
console.log('NUEVA CONTRASEÑA:', newPassword);
