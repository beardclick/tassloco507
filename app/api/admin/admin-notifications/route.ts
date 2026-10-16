import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { getAllAdminEmails, setNotificationDisabled } from '@/lib/notification-settings';
import { emailField, readJsonObject, errorResponse, RequestError } from '@/lib/request-security';

export async function PUT(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  try {
    const body = await readJsonObject(req);
    const email = emailField(body.email);
    if (typeof body.disabled !== 'boolean') throw new RequestError('Selecciona una preferencia válida.');
    if (!(await getAllAdminEmails()).includes(email)) throw new RequestError('Administrador no encontrado.', 404);
    await setNotificationDisabled(email, body.disabled);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
