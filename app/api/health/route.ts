import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Comprobación de vida pública: sin credenciales, consultas ni escrituras.
export async function GET() {
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
