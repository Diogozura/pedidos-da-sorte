import { NextRequest, NextResponse } from 'next/server';
import { getStatus } from '@/lib/whats-server';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.nextUrl.searchParams.get('tenantId');
    if (!tenantId) return NextResponse.json({ error: 'tenantId obrigatório' }, { status: 400 });
    const data = await getStatus(tenantId);
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message) }, { status: 500 });
  }
}
