import { NextResponse } from 'next/server';
import { AUTH_COOKIE, signToken, verifyCredentials } from '@/lib/auth';

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const user = String(body.user ?? '');
  const password = String(body.password ?? '');

  if (!verifyCredentials(user, password)) {
    return NextResponse.json(
      { ok: false, error: 'Usuario o contraseña incorrectos' },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, signToken(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
