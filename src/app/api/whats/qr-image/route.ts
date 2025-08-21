import { NextRequest, NextResponse } from 'next/server';
import { getQrImage } from '@/lib/whats-server';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId');
  if (!tenantId) return NextResponse.json({ error: 'tenantId obrigatório' }, { status: 400 });
  const res = await getQrImage(tenantId);
  return new NextResponse(res.body, { status: res.status, headers: { 'Content-Type': res.headers.get('content-type') ?? 'image/png' } });
}
