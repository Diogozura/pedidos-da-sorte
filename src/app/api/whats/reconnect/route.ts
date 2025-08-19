import { NextRequest, NextResponse } from 'next/server';
import { botReconnect } from '@/lib/whats-server';

export async function POST(req: NextRequest) {
  try {
    const { hard } = (await req.json()) as { hard?: boolean };
    const r = await botReconnect(Boolean(hard));
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
