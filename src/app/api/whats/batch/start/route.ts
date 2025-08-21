import { NextRequest, NextResponse } from 'next/server';
import { mintToken } from '@/lib/whats-server';

const BASE = (process.env.WHATS_SENDER_BASEURL ?? 'http://localhost:3001').replace(/\/+$/,'');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      tenantId?: string;
      numbers?: string[];
      message?: string;
      items?: Array<{ number: string; message: string }>;
      delayMsBetween?: number;
    };

    const { tenantId, numbers, message, items, delayMsBetween } = body;
    if (!tenantId) return NextResponse.json({ error: 'tenantId obrigatório' }, { status: 400 });
    if (!items && (!numbers || !message)) {
      return NextResponse.json({ error: 'Envie "items" ou "numbers"+"message".' }, { status: 400 });
    }

    // token para o MESMO tenant do lote
    const bearer = await mintToken(tenantId);

    const res = await fetch(`${BASE}/api/send-multiple-async`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearer}`,
      },
      body: JSON.stringify({ tenantId, numbers, message, items, delayMsBetween }),
    });

    const text = await res.text();
    if (!res.ok) return NextResponse.json({ error: text }, { status: res.status });
    // o sender retorna { batchId, queued }
    return new NextResponse(text, { status: res.status, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 500 });
  }
}
