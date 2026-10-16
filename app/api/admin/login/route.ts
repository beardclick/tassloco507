import { NextResponse } from 'next/server';
import { AUTH_COOKIE, loginAdmin } from '@/lib/auth';
import { cookieOptions } from '@/lib/session-token';
import { enforceRateLimit } from '@/lib/rate-limit';
import { readJsonObject, textField, passwordField, errorResponse, RequestError } from '@/lib/request-security';

export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit(req, 'admin-login-ip', 20, 900);
    if (limited) return limited;
    const body = await readJsonObject(req);
    if (body.website) throw new RequestError('Solicitud inválida.');
    const user = textField(body.user, 254, true).toLowerCase();
    const password = passwordField(body.password);
    const accountLimited = await enforceRateLimit(req, 'admin-login-account', 5, 900, user);
    if (accountLimited) return accountLimited;
    const token = await loginAdmin(user, password);
    if (!token) return NextResponse.json({ ok: false, error: 'Usuario o contraseña incorrectos' }, { status: 401 });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(AUTH_COOKIE, token, cookieOptions('admin'));
    return res;
  } catch (error) { return errorResponse(error); }
}
