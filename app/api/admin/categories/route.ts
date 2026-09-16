import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { createCategory } from '@/lib/db';

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const body = await req.json();
  const name = String(body.name ?? '').trim();
  if (!name) {
    return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
  }
  const category = await createCategory({
    name,
    parent: body.parent ? Number(body.parent) : 0,
    description: String(body.description ?? '').trim(),
    image: body.image ? String(body.image).trim() : null,
  });
  return NextResponse.json({ ok: true, category });
}
