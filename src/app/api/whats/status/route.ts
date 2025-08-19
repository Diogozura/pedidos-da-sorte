import { NextResponse } from 'next/server';
import { botGetStatus } from '@/lib/whats-server';

export async function GET() {
  try {
    const data = await botGetStatus();
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
