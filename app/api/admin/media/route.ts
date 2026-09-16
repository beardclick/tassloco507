import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { getSupabase, STORAGE_BUCKET } from '@/lib/supabase';

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const sb = getSupabase();
  const { data, error } = await sb.storage.from(STORAGE_BUCKET).list();
  if (error) {
    return NextResponse.json({ ok: true, items: [] });
  }
  const items = (data ?? [])
    .filter((f) => /\.(jpe?g|png|webp|gif|svg|avif)$/i.test(f.name))
    .map((f) => ({
      url: sb.storage.from(STORAGE_BUCKET).getPublicUrl(f.name).data.publicUrl,
      name: f.name,
    }))
    .sort((a, b) => b.name.localeCompare(a.name));
  return NextResponse.json({ ok: true, items });
}
