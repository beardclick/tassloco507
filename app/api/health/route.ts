import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const info: Record<string, unknown> = {
    supabase_url: Boolean(process.env.SUPABASE_URL),
    supabase_service_role_key: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    admin_vars: Boolean(process.env.ADMIN_USER && process.env.ADMIN_PASSWORD),
    auth_secret: Boolean(process.env.AUTH_SECRET),
    admin_secret: Boolean(process.env.ADMIN_SECRET),
    resend_key: Boolean(process.env.RESEND_API_KEY),
    node_env: process.env.NODE_ENV,
  };

  try {
    const { getSupabase } = await import('@/lib/supabase');
    const sb = getSupabase();
    const { count, error } = await sb.from('products').select('*', { count: 'exact', head: true });
    info.products = error ? `ERROR: ${error.message}` : count;
    const { count: catCount, error: catErr } = await sb.from('categories').select('*', {
      count: 'exact',
      head: true,
    });
    info.categories = catErr ? `ERROR: ${catErr.message}` : catCount;
    const { data: buckets, error: bErr } = await sb.storage.listBuckets();
    info.buckets = bErr ? `ERROR: ${bErr.message}` : (buckets ?? []).map((b) => b.name);
  } catch (e) {
    info.error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(info);
}
