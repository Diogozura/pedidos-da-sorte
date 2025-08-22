import { NextRequest, NextResponse } from 'next/server';
import { mintToken } from '@/lib/whats-server';

const BASE = (process.env.BOT_BASE_URL ?? 'http://localhost:3001').replace(/\/+$/,'');

export async function POST(
  req: NextRequest,
  { params }: { params: { batchId: string } } 
) {
  try {
    const { tenantId } = (await req.json()) as { tenantId?: string };
    if (!tenantId) return NextResponse.json({ error: 'tenantId obrigatório' }, { status: 400 });

    const bearer = await mintToken(tenantId);

    const res = await fetch(`${BASE}/api/batches/${params.batchId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}` },
    });

    const text = await res.text();
    if (!res.ok) return NextResponse.json({ error: text }, { status: res.status });
    return new NextResponse(text, { status: res.status, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 500 });
  }
}