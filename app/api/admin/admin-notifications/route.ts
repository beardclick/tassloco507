import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { setNotificationDisabled } from '@/lib/notification-settings';

export async function PUT(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const body = await req.json();
  const email = String(body.email ?? '').trim();
  if (!email) {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
  }
  await setNotificationDisabled(email, Boolean(body.disabled));
  return NextResponse.json({ ok: true });
}
