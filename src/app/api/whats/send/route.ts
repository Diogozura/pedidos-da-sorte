import { NextRequest, NextResponse } from 'next/server';
import { sendMessage } from '@/lib/whats-server';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId') ?? undefined;
  const body = (await req.json()) as { to: string; message: string; tenantId?: string };
  const t = body.tenantId ?? tenantId;
  if (!t) return NextResponse.json({ error: 'tenantId ausente' }, { status: 400 });
  const data = await sendMessage(t, body.to, body.message);
  return NextResponse.json(data);
}
