import { NextRequest, NextResponse } from 'next/server';
import { getQrImage } from '@/lib/whats-server';

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId') ?? undefined;
  const upstream = await getQrImage(tenantId);
  // repassa o stream/png do sender
  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: { 'content-type': 'image/png', 'cache-control': 'no-store' },
  });
}
