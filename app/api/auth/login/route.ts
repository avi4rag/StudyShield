import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { createSessionToken, setSessionCookie } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user || !user.is_active || !(await verifyPassword(password, user.password_hash))) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    const session = { userId: user.user_id, email: user.email, name: user.full_name, role: user.role };
    const response = NextResponse.json({ user: session });
    setSessionCookie(response, await createSessionToken(session));
    return response;
  } catch (error) {
    console.error('[POST /api/auth/login]', error);
    return NextResponse.json({ error: 'Unable to sign in.' }, { status: 500 });
  }
}
