import { NextRequest, NextResponse } from 'next/server';
import { botLogs } from '@/lib/whats-server';

export async function GET(_req: NextRequest, { params }: { params: { tenantId: string } }) {
  try {
    const data = await botLogs(params.tenantId);
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
