import { NextResponse } from 'next/server';
import { AUTH_COOKIE, signToken, verifyCredentials } from '@/lib/auth';
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

  let authenticated = verifyCredentials(user, password);

  // También permite entrar con un usuario confirmado de Supabase Auth.
  if (!authenticated && user.includes('@') && password) {
    try {
      const { data, error } = await getSupabase().auth.signInWithPassword({
        email: user.toLowerCase(),
        password,
      });
      authenticated = Boolean(data.user && !error);
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
  // La cookie representa la sesión interna del panel, independientemente
  // de si la autenticación se hizo con las credenciales legacy o Supabase.
  res.cookies.set(AUTH_COOKIE, signToken(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
