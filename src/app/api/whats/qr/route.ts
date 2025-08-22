import { NextRequest, NextResponse } from 'next/server';
import { getQrText, reconnectTenant, getStatus } from '@/lib/whats-server';
export const dynamic = 'force-dynamic';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId') ?? req.headers.get('x-tenant-id') ?? undefined;
  if (!tenantId) return NextResponse.json({ error: 'tenantId obrigatório' }, { status: 400 });

  // tenta direto
  let res = await getQrText(tenantId);
  if (res.ok) return new NextResponse(await res.text(), { headers: { 'Content-Type': 'text/plain' } });

  // força reconnect se precisar
  try {
    const st = await getStatus(tenantId);
    if (st.status !== 'conectado') await reconnectTenant(tenantId, false);
  } catch {}

  // polling por ~12s
  for (let i = 0; i < 12; i++) {
    await sleep(1000);
    res = await getQrText(tenantId);
    if (res.ok) return new NextResponse(await res.text(), { headers: { 'Content-Type': 'text/plain' } });
  }
  return NextResponse.json({ status: 'pending', error: 'QR ainda não disponível' }, { status: 202 });
}
