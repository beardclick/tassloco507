import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { deleteCategory, updateCategory } from '@/lib/db';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const updated = updateCategory(Number(id), {
    name: String(body.name ?? '').trim(),
    parent: body.parent ? Number(body.parent) : 0,
    description: String(body.description ?? '').trim(),
    image: body.image ? String(body.image).trim() : null,
  });
  if (!updated) {
    return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, category: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { id } = await params;
  const ok = deleteCategory(Number(id));
  if (!ok) {
    return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
