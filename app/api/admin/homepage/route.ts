import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { saveHomepageSettings } from '@/lib/homepage-settings';

export async function PUT(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const heroImage = String(body.heroImage ?? '').trim();
    const marqueeItems = Array.isArray(body.marqueeItems) ? body.marqueeItems : [];

    if (!heroImage) {
      return NextResponse.json({ error: 'La imagen del hero es obligatoria' }, { status: 400 });
    }
    if (marqueeItems.length === 0) {
      return NextResponse.json({ error: 'Agrega al menos un texto al marquee' }, { status: 400 });
    }

    const settings = await saveHomepageSettings({ ...body, heroImage, marqueeItems });
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo guardar';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
