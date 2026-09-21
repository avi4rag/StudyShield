import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json(
    { error: 'Public account creation is disabled. Contact your company administrator.' },
    { status: 403 },
  );
}
