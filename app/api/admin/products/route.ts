import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { createProduct } from '@/lib/db';
import { parseProductInput, resolveCategories } from '@/lib/admin';

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const body = await req.json();
  const input = parseProductInput(body);
  if (!input.name) {
    return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
  }
  const product = createProduct(input, resolveCategories(input.categoryIds));
  return NextResponse.json({ ok: true, product });
}
