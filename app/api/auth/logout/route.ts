import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CUSTOMER_COOKIE } from '@/lib/customer-auth';
import { revokeSession } from '@/lib/sessions';
import { cookieOptions } from '@/lib/session-token';
import { errorResponse } from '@/lib/request-security';

export async function POST() {
  try {
    const store = await cookies();
    await revokeSession(store.get(CUSTOMER_COOKIE)?.value, 'customer');
    const res = NextResponse.json({ ok: true });
    res.cookies.set(CUSTOMER_COOKIE, '', { ...cookieOptions('customer'), maxAge: 0 });
    return res;
  } catch (error) { return errorResponse(error); }
}
