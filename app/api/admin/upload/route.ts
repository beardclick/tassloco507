import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { isAdminRequest } from '@/lib/auth';
import { getSupabase, STORAGE_BUCKET } from '@/lib/supabase';

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

  const bytes = await file.arrayBuffer();
  const name = `${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`;

  const sb = getSupabase();
  const { error } = await sb.storage.from(STORAGE_BUCKET).upload(name, bytes, {
    contentType: file.type || 'application/octet-stream',
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const url = sb.storage.from(STORAGE_BUCKET).getPublicUrl(name).data.publicUrl;
  return NextResponse.json({ ok: true, url });
}
