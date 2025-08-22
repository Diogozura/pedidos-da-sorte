import { NextRequest, NextResponse } from 'next/server';
import { reconnectTenant } from '@/lib/whats-server';

export const dynamic = 'force-dynamic';

function readTenantAndHard(req: NextRequest) {
  // usa URL “crua” em vez de nextUrl (mais seguro em Node)
  const url = new URL(req.url);
  const tenantId =
    url.searchParams.get('tenantId') ??
    req.headers.get('x-tenant-id') ??
    undefined;

  const hardParam =
    url.searchParams.get('hard') ??
    req.headers.get('x-whats-hard') ??
    undefined;

  const hard =
    hardParam === '1' ||
    (typeof hardParam === 'string' && hardParam.toLowerCase() === 'true');

  return { tenantId, hard };
}

export async function GET(req: NextRequest) {
  const { tenantId, hard } = readTenantAndHard(req);
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId obrigatório' }, { status: 400 });
  }
  const data = await reconnectTenant(tenantId, hard);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const qTenant = url.searchParams.get('tenantId');
  const qHard = url.searchParams.get('hard');

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const tenantId: string | undefined =
    body?.tenantId ?? qTenant ?? req.headers.get('x-tenant-id') ?? undefined;

  const hardParam =
    body?.hard ?? qHard ?? req.headers.get('x-whats-hard') ?? false;

  const hard =
    hardParam === true ||
    hardParam === '1' ||
    (typeof hardParam === 'string' && hardParam.toLowerCase() === 'true');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId obrigatório' }, { status: 400 });
  }
  const data = await reconnectTenant(tenantId, hard);
  return NextResponse.json(data);
}
