import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { getOrderNotificationEmails, setOrderNotificationEmails } from '@/lib/notification-settings';

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return NextResponse.json({ emails: await getOrderNotificationEmails() });
}

export async function PUT(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const emails = await setOrderNotificationEmails(Array.isArray(body.emails) ? body.emails : []);
    return NextResponse.json({ ok: true, emails });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
