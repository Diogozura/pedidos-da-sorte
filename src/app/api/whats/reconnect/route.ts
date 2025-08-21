import { NextRequest, NextResponse } from 'next/server';
import { reconnectTenant } from '@/lib/whats-server';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { tenantId } = await req.json();
  if (!tenantId) return NextResponse.json({ error: 'tenantId obrigatório' }, { status: 400 });
  const data = await reconnectTenant(tenantId);
  return NextResponse.json(data);
}
