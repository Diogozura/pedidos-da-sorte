import { NextResponse, NextRequest } from 'next/server';

const DASHBOARD_HOSTS = new Set([
  'dashboard.pedidodasorte.com.br',
  // Adicione variações se usar sem WWW ou ambientes de preview
  // 'dashboard-<seu-projeto>.vercel.app'
]);

// Se tiver deploy na Vercel, ela envia x-vercel-deployment-url.
// Em outros hosts, use req.headers.get('host').
function getHost(req: NextRequest) {
  return req.headers.get('x-forwarded-host')
    ?? req.headers.get('host')
    ?? '';
}

export function middleware(req: NextRequest) {
  const host = getHost(req).toLowerCase();
  const { pathname, search } = req.nextUrl;

  // Bypass para assets/next e arquivos estáticos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/assets')
  ) {
    return NextResponse.next();
  }

  // Se for o subdomínio do dashboard, reescreve tudo para /dashboard
  if (DASHBOARD_HOSTS.has(host)) {
    // Mantém chamadas de API no mesmo caminho (ex.: /api/*)
    if (pathname.startsWith('/api')) {
      return NextResponse.next();
    }

    // Evita dupla prefixação
    if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
      return NextResponse.next();
    }

    const target = pathname === '/' ? '/dashboard' : `/dashboard${pathname}`;
    const url = req.nextUrl.clone();
    url.pathname = target;
    url.search = search;
    return NextResponse.rewrite(url);
  }

  // Demais hosts (ex.: sorteio.pedidodasorte.com.br) seguem normal
  return NextResponse.next();
}

export const config = {
  matcher: ['/(:path*)'],
};
