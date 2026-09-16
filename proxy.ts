import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { getSessionTokenFromRequest, verifySessionToken } from '@/lib/auth/session';

export const proxy = auth(async (request) => {
  if (request.auth?.user) return NextResponse.next();

  const token = getSessionTokenFromRequest(request);
  const session = token ? await verifySessionToken(token) : null;
  if (!session) return NextResponse.redirect(new URL('/login', request.url));
  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*', '/students/:path*', '/messages/:path*', '/instructor/:path*', '/student/:path*'],
};
