import { NextRequest, NextResponse } from 'next/server';
import { disconnectTenant } from '@/lib/whats-server';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { tenantId } = await req.json();
  if (!tenantId) return NextResponse.json({ error: 'tenantId obrigatório' }, { status: 400 });
  const data = await disconnectTenant(tenantId);
  return NextResponse.json(data);
}
