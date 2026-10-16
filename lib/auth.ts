import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { getAdminByEmail, getAdminById } from './db';
import { verifyPassword } from './password';
import { createSession, credentialVersion, readSession } from './sessions';
import { getSupabase } from './supabase';
import { createAdminAuthClient, isAuthorizedAuthAdmin } from './supabase-admin-auth';

export const AUTH_COOKIE = 'tassloco_admin';
export const ADMIN_USER = process.env.ADMIN_USER?.trim().toLowerCase() || '';

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function legacyCredentials(): { user: string; password: string } | null {
  const user = process.env.ADMIN_USER?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!user || !password || password.length < 12 || /^(tassloco507|una-contrasena-segura)$/i.test(password)) return null;
  return { user, password };
}

export async function loginAdmin(email: string, password: string): Promise<string | null> {
  const identity = email.trim().toLowerCase();
  const admin = await getAdminByEmail(identity);
  if (admin && verifyPassword(password, admin.passwordHash)) {
    return createSession({ kind: 'admin', subject_id: `db:${admin.id}`, identity, credential_version: credentialVersion(admin.passwordHash) });
  }
  const legacy = legacyCredentials();
  if (legacy && safeEqual(identity, legacy.user) && safeEqual(password, legacy.password)) {
    return createSession({ kind: 'admin', subject_id: 'env', identity, credential_version: credentialVersion(legacy.password) });
  }
  if (!identity.includes('@')) return null;
  const { data, error } = await createAdminAuthClient().auth.signInWithPassword({ email: identity, password });
  if (error || !data.user || !isAuthorizedAuthAdmin(data.user)) return null;
  return createSession({ kind: 'admin', subject_id: `auth:${data.user.id}`, identity, credential_version: credentialVersion(data.user.updated_at ?? '') });
}

export async function verifyToken(token: string | undefined | null): Promise<string | null> {
  const session = await readSession(token, 'admin');
  if (!session) return null;
  if (session.subject_id.startsWith('db:')) {
    const admin = await getAdminById(Number(session.subject_id.slice(3)));
    return admin && admin.email.toLowerCase() === session.identity && credentialVersion(admin.passwordHash) === session.credential_version ? session.identity : null;
  }
  if (session.subject_id === 'env') {
    const legacy = legacyCredentials();
    return legacy && legacy.user === session.identity && credentialVersion(legacy.password) === session.credential_version ? session.identity : null;
  }
  if (session.subject_id.startsWith('auth:')) {
    const { data, error } = await getSupabase().auth.admin.getUserById(session.subject_id.slice(5));
    return !error && data.user && isAuthorizedAuthAdmin(data.user) && data.user.email?.toLowerCase() === session.identity
      && credentialVersion(data.user.updated_at ?? '') === session.credential_version ? session.identity : null;
  }
  return null;
}

export const currentAdminIdentity = cache(async function currentAdminIdentity(): Promise<string | null> {
  const store = await cookies();
  return verifyToken(store.get(AUTH_COOKIE)?.value);
});

export async function requireAdmin(): Promise<void> {
  if (!(await currentAdminIdentity())) redirect('/admin/login');
}

export async function isAdminRequest(): Promise<boolean> {
  return Boolean(await currentAdminIdentity());
}
