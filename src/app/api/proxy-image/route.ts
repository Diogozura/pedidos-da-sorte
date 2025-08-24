import { NextResponse } from 'next/server';

// aceite ambos formatos de host que o Firebase usa
const ALLOWED = /^(firebasestorage\.googleapis\.com|storage\.googleapis\.com)$/;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const u = url.searchParams.get('u');
  if (!u) return NextResponse.json({ error: 'Missing ?u=' }, { status: 400 });

  let upstream: URL;
  try {
    upstream = new URL(u);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  if (!ALLOWED.test(upstream.host)) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 400 });
  }

  // busca a imagem toda (arrayBuffer) para evitar problemas de stream
  const resp = await fetch(upstream.toString(), { cache: 'no-store' });
  const buf = await resp.arrayBuffer();

  // se o upstream falhou, propague o status, mas com corpo
  const status = resp.ok ? 200 : resp.status || 500;
  const contentType = resp.headers.get('content-type') ?? 'image/png';

  return new NextResponse(buf, {
    status,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
