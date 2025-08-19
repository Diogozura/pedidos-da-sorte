import { NextRequest, NextResponse } from 'next/server';
import { botSend } from '@/lib/whats-server';

type Body = { tenantId: string; phone: string; message: string };

export async function POST(req: NextRequest) {
  try {
    const { tenantId, phone, message } = (await req.json()) as Body;
    if (!tenantId || !phone || !message) {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
    }
    const r = await botSend({ tenantId, phone, message });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
