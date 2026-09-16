import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { createAdmin, getAdminByEmail } from '@/lib/db';
import { hashPassword } from '@/lib/password';

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const body = await req.json();
  const nombre = String(body.nombre ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  if (!nombre || !email || password.length < 6) {
    return NextResponse.json(
      { error: 'Completa nombre, correo válido y contraseña (mín. 6 caracteres)' },
      { status: 400 },
    );
  }
  if (await getAdminByEmail(email)) {
    return NextResponse.json({ error: 'Ya existe un administrador con ese correo' }, { status: 400 });
  }
  const admin = await createAdmin({ nombre, email, passwordHash: hashPassword(password) });
  const { passwordHash: _drop, ...safe } = admin;
  void _drop;
  return NextResponse.json({ ok: true, admin: safe });
}
