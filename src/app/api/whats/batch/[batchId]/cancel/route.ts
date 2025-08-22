// src/app/api/whats/batch/[batchId]/cancel/route.ts
import { NextResponse } from 'next/server';
import { mintToken } from '@/lib/whats-server';

const BASE = (process.env.BOT_BASE_URL ?? 'http://localhost:3001').replace(/\/+$/, '');

export async function POST(req: Request) {
  // Extrai o batchId da URL: /api/whats/batch/:batchId/cancel
  const url = new URL(req.url);
  const parts = url.pathname.split('/'); // ['','api','whats','batch',':batchId','cancel']
  const i = parts.lastIndexOf('batch');
  const batchId = i >= 0 ? parts[i + 1] : '';

  if (!batchId) {
    return NextResponse.json({ error: 'batchId obrigatório' }, { status: 400 });
  }

  try {
    const body = (await req.json()) as { tenantId?: string };
    const tenantId = body?.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId obrigatório' }, { status: 400 });
    }

    const bearer = await mintToken(tenantId);

    const res = await fetch(`${BASE}/api/batches/${batchId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}` },
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json({ error: text }, { status: res.status });
    }

    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 500 });
  }
}
