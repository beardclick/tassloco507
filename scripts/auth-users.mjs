// Lista los usuarios de Supabase Auth (para diagnóstico).
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await sb.auth.admin.listUsers();
if (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
const users = data.users ?? [];
console.log(`Total usuarios Auth: ${users.length}`);
for (const u of users) {
  console.log(`- ${u.id} | ${u.email ?? '(sin email)'} | confirmado: ${Boolean(u.email_confirmed_at)} | creado: ${u.created_at}`);
}
