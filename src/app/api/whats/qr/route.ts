import { NextRequest, NextResponse } from 'next/server';
import { getQrText } from '@/lib/whats-server';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId');
  if (!tenantId) return NextResponse.json({ error: 'tenantId obrigatório' }, { status: 400 });
  const res = await getQrText(tenantId); // Response do sender
  return new NextResponse(await res.text(), { status: res.status, headers: { 'Content-Type': 'text/plain' } });
}
