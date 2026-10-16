import { NextResponse, type NextRequest } from 'next/server';
import { isTrustedMutation } from './lib/request-origin';

export function middleware(req: NextRequest) {
  if (!isTrustedMutation(req)) return NextResponse.json({ error: 'Origen no permitido.' }, { status: 403 });
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = { matcher: ['/api/:path*', '/admin/:path*', '/my-account'] };
