import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { isAdminRequest } from '@/lib/auth';
import { getSupabase, STORAGE_BUCKET } from '@/lib/supabase';
import { detectImage } from '@/lib/image-upload';
import { readBodyBytes, errorResponse } from '@/lib/request-security';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

async function upload(req: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await readBodyBytes(req, MAX_BYTES + 64 * 1024);
  const formData = await new Response(body, { headers: { 'Content-Type': req.headers.get('content-type') ?? '' } }).formData();
  const file = formData.get('file') as File | null;
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'La imagen supera los 10 MB' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const image = detectImage(new Uint8Array(bytes));
  if (!image) {
    return NextResponse.json({ error: 'Formato no permitido' }, { status: 400 });
  }

  const name = `${Date.now()}-${randomBytes(16).toString('hex')}.${image.extension}`;

  const sb = getSupabase();
  const { error } = await sb.storage.from(STORAGE_BUCKET).upload(name, bytes, {
    contentType: image.contentType,
  });
  if (error) {
    return NextResponse.json({ error: 'No se pudo guardar la imagen.' }, { status: 503 });
  }

  const url = sb.storage.from(STORAGE_BUCKET).getPublicUrl(name).data.publicUrl;
  return NextResponse.json({ ok: true, url });
}

export async function POST(req: Request) {
  try { return await upload(req); } catch (error) { return errorResponse(error); }
}
