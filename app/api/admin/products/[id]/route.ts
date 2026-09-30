import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { deleteProduct, updateProduct } from '@/lib/db';
import { parseProductInput, resolveCategories } from '@/lib/admin';
import { errMsg } from '@/lib/errors';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const input = parseProductInput(body);
  try {
    const updated = await updateProduct(Number(id), input, await resolveCategories(input.categoryIds));
    if (!updated) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, product: updated });
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { id } = await params;
  const ok = await deleteProduct(Number(id));
  if (!ok) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
