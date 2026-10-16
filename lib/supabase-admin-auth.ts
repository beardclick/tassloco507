import 'server-only';
import { createClient, type User } from '@supabase/supabase-js';

export function isAuthorizedAuthAdmin(user: User): boolean {
  const allowlist = (process.env.SUPABASE_ADMIN_EMAILS ?? '').split(',').map(email => email.trim().toLowerCase()).filter(Boolean);
  const bannedUntil = (user as User & { banned_until?: string }).banned_until;
  return Boolean(user.email_confirmed_at && user.email && !user.is_anonymous
    && (!bannedUntil || new Date(bannedUntil).getTime() <= Date.now())
    && (user.app_metadata?.role === 'admin' || allowlist.includes(user.email.toLowerCase())));
}

// Nunca iniciar sesión sobre el cliente service_role compartido.
export function createAdminAuthClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
