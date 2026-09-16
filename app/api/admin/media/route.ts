import { NextResponse } from 'next/server';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { isAdminRequest } from '@/lib/auth';

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const dir = path.join(process.cwd(), 'public', 'uploads');
  try {
    const files = await readdir(dir);
    const items = files
      .filter((f) => /\.(jpe?g|png|webp|gif|svg|avif)$/i.test(f))
      .map((f) => ({ url: `/uploads/${f}`, name: f }))
      .sort((a, b) => b.name.localeCompare(a.name));
    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json({ ok: true, items: [] });
  }
}
