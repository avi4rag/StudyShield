import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const role = body.role === 'STUDENT' ? 'STUDENT' : 'EDUCATOR';
    if (fullName.length < 2 || fullName.length > 100) return NextResponse.json({ error: 'Full name must be between 2 and 100 characters.' }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 255) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    if (password.length < 8 || password.length > 128) return NextResponse.json({ error: 'Password must be between 8 and 128 characters.' }, { status: 400 });
    const existing = await prisma.users.findUnique({ where: { email }, select: { user_id: true } });
    if (existing) return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
    const user = await prisma.users.create({
      data: { full_name: fullName, email, password_hash: await hashPassword(password), role },
      select: { user_id: true, email: true, full_name: true, role: true },
    });
    return NextResponse.json({ user: { userId: user.user_id, email: user.email, name: user.full_name, role: user.role } }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/auth/signup]', error);
    return NextResponse.json({ error: 'Unable to create account.' }, { status: 500 });
  }
}
