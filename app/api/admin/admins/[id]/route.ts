import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { deleteAdmin, getAdminByEmail, updateAdmin } from '@/lib/db';
import { hashPassword } from '@/lib/password';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const nombre = String(body.nombre ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  if (!nombre || !email) {
    return NextResponse.json({ error: 'Nombre y correo son obligatorios' }, { status: 400 });
  }
  const existing = await getAdminByEmail(email);
  if (existing && existing.id !== Number(id)) {
    return NextResponse.json({ error: 'Ya existe otro administrador con ese correo' }, { status: 400 });
  }
  const password = String(body.password ?? '');
  const updated = await updateAdmin(Number(id), {
    nombre,
    email,
    passwordHash: password.length >= 6 ? hashPassword(password) : undefined,
  });
  if (!updated) {
    return NextResponse.json({ error: 'Administrador no encontrado' }, { status: 404 });
  }
  const { passwordHash: _drop, ...safe } = updated;
  void _drop;
  return NextResponse.json({ ok: true, admin: safe });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { id } = await params;
  const ok = await deleteAdmin(Number(id));
  if (!ok) {
    return NextResponse.json({ error: 'Administrador no encontrado' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
