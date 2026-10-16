import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE } from '@/lib/auth';
import { revokeSession } from '@/lib/sessions';
import { cookieOptions } from '@/lib/session-token';
import { errorResponse } from '@/lib/request-security';

export async function POST() {
  try {
    const store = await cookies();
    await revokeSession(store.get(AUTH_COOKIE)?.value, 'admin');
    const res = NextResponse.json({ ok: true });
    res.cookies.set(AUTH_COOKIE, '', { ...cookieOptions('admin'), maxAge: 0 });
    return res;
  } catch (error) { return errorResponse(error); }
}
