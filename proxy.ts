import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionTokenFromRequest, verifySessionToken } from '@/lib/auth/session';

export async function proxy(request: NextRequest) {
  const token = getSessionTokenFromRequest(request);
  const session = token ? await verifySessionToken(token) : null;
  if (!session) return NextResponse.redirect(new URL('/login', request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/students/:path*', '/messages/:path*', '/instructor/:path*', '/student/:path*'],
};
