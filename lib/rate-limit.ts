import 'server-only';
import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { NextResponse } from 'next/server';
import { getSupabase } from './supabase';
import { sessionSecret } from './session-token';

function clientAddress(req: Request): string {
  // Vercel sustituye esta cabecera. En otros hosts hay que configurar un proxy
  // que quite la cabecera recibida del visitante antes de habilitar TRUST_PROXY.
  const header = process.env.VERCEL === '1' ? 'x-vercel-forwarded-for'
    : process.env.TRUST_PROXY === '1' ? 'x-forwarded-for' : null;
  const address = header ? req.headers.get(header)?.split(',')[0].trim() : '';
  return address && isIP(address) ? address : 'shared';
}

export async function enforceRateLimit(req: Request, scope: string, limit: number, windowSeconds: number, identity?: string): Promise<NextResponse | null> {
  const identifier = identity === undefined ? `ip:${clientAddress(req)}` : `identity:${identity.trim().toLowerCase()}`;
  const key = createHmac('sha256', sessionSecret('customer')).update(`${scope}:${identifier}`).digest('hex');
  const { data, error } = await getSupabase().rpc('security_check_rate_limit', {
    p_key: key, p_limit: limit, p_window_seconds: windowSeconds,
  });
  if (error || !data || typeof data.allowed !== 'boolean') throw new Error('Rate limit unavailable');
  if (data.allowed) return null;
  return NextResponse.json({ ok: false, error: 'Demasiados intentos. Inténtalo más tarde.' }, {
    status: 429, headers: { 'Retry-After': String(Math.max(1, Number(data.retry_after) || windowSeconds)) },
  });
}
