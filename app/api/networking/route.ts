import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Professional Networking is not part of the current MVP.' },
    { status: 410 }
  );
}
