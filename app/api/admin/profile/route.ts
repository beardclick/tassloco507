import { NextResponse } from 'next/server';
import { currentAdminIdentity, isAdminRequest } from '@/lib/auth';
import {
  getAdminByEmail,
  getSupabaseAuthUsers,
  updateAdmin,
  updateSupabaseAuthPassword,
} from '@/lib/db';
import { hashPassword } from '@/lib/password';

export async function PUT(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const identity = await currentAdminIdentity();
  if (!identity) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();
  const password = String(body.password ?? '');
  if (password.length < 6) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 });
  }

  // 1) Administrador en la tabla `admins`.
  const dbAdmin = await getAdminByEmail(identity);
  if (dbAdmin) {
    await updateAdmin(dbAdmin.id, { passwordHash: hashPassword(password) });
    return NextResponse.json({ ok: true, type: 'db' });
  }

  // 2) Usuario de Supabase Auth.
  const authUsers = await getSupabaseAuthUsers();
  const authUser = authUsers.find((u) => u.email.toLowerCase() === identity);
  if (authUser) {
    const ok = await updateSupabaseAuthPassword(authUser.id, password);
    if (ok) return NextResponse.json({ ok: true, type: 'auth' });
    return NextResponse.json({ error: 'No se pudo actualizar la contraseña' }, { status: 500 });
  }

  return NextResponse.json(
    { error: 'Este acceso no permite cambiar contraseña (usa las variables de entorno).' },
    { status: 400 },
  );
}
