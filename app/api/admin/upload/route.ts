import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { isAdminRequest } from '@/lib/auth';

const ALLOWED = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif'];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'La imagen supera los 10 MB' }, { status: 400 });
  }

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!ALLOWED.includes(ext)) {
    return NextResponse.json({ error: 'Formato no permitido' }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const name = `${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`;
  const dir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);

  return NextResponse.json({ ok: true, url: `/uploads/${name}` });
}
