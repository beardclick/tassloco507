import { NextResponse } from 'next/server';
import { AUTH_COOKIE, ADMIN_USER, signToken, verifyCredentials } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const user = String(body.user ?? '');
  const password = String(body.password ?? '');
  // Honeypot anti-spam
  if (String(body.website ?? '').trim()) {
    return NextResponse.json({ ok: false, error: 'Solicitud inválida' }, { status: 400 });
  }

  let identity = await verifyCredentials(user, password);
  let authenticated = Boolean(identity);

  // También permite entrar con un usuario confirmado de Supabase Auth.
  if (!authenticated && user.includes('@') && password) {
    try {
      const { data, error } = await getSupabase().auth.signInWithPassword({
        email: user.toLowerCase(),
        password,
      });
      if (data.user && !error) {
        authenticated = true;
        identity = user.toLowerCase();
      }
    } catch {
      authenticated = false;
    }
  }

  if (!authenticated) {
    return NextResponse.json(
      { ok: false, error: 'Usuario o contraseña incorrectos' },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, signToken(identity || ADMIN_USER), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
