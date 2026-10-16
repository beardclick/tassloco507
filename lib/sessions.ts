import 'server-only';
import { createHash } from 'node:crypto';
import { getSupabase } from './supabase';
import { issueToken, validToken, SESSION_TTL, type SessionKind } from './session-token';

export interface Session {
  kind: SessionKind;
  subject_id: string;
  identity: string;
  credential_version: string;
}

export function credentialVersion(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export async function createSession(session: Session): Promise<string> {
  const token = issueToken(session.kind);
  const { error } = await getSupabase().from('security_sessions').insert({
    ...session, token_hash: credentialVersion(token),
    expires_at: new Date(Date.now() + SESSION_TTL[session.kind] * 1000).toISOString(),
  });
  if (error) throw new Error('No se pudo crear la sesión. Comprueba la migración de seguridad.');
  return token;
}

export async function readSession(token: string | undefined | null, kind: SessionKind): Promise<Session | null> {
  if (!validToken(token, kind)) return null;
  const { data, error } = await getSupabase().from('security_sessions')
    .select('kind,subject_id,identity,credential_version').eq('token_hash', credentialVersion(token!))
    .eq('kind', kind).gt('expires_at', new Date().toISOString()).maybeSingle();
  return error ? null : data as Session | null;
}

export async function revokeSession(token: string | undefined | null, kind: SessionKind): Promise<void> {
  if (!validToken(token, kind)) return;
  const { error } = await getSupabase().from('security_sessions').delete().eq('token_hash', credentialVersion(token!)).eq('kind', kind);
  if (error) throw new Error('No se pudo revocar la sesión.');
}

export async function revokeSubjectSessions(kind: SessionKind, subjectId: string): Promise<void> {
  const { error } = await getSupabase().from('security_sessions').delete().eq('kind', kind).eq('subject_id', subjectId);
  if (error) throw new Error('No se pudieron revocar las sesiones.');
}
