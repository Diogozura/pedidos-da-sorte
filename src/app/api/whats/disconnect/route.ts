import { NextRequest, NextResponse } from 'next/server';
import { disconnect } from '@/lib/whats-server';

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get('tenantId') ?? undefined;
  const hard = (url.searchParams.get('hard') ?? '0') === '1';
  const data = await disconnect(tenantId, hard);
  return NextResponse.json(data);
}
