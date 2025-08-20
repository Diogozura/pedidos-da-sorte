import { NextRequest, NextResponse } from 'next/server';
import { getQrText } from '@/lib/whats-server';

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId') ?? undefined;
  const data = await getQrText(tenantId);
  return NextResponse.json(data, { headers: { 'cache-control': 'no-store' } });
}
