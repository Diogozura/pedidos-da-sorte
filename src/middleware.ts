import { NextRequest, NextResponse } from 'next/server';

function getHost(req: NextRequest): string {
  // Em Vercel normalmente é 'host'
  return (req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? '')
    .toLowerCase()
    .trim();
}

function isStatic(pathname: string) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/assets') ||
    pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|txt|xml|json)$/)
  );
}

export function middleware(req: NextRequest) {
  const host = getHost(req);
  const { pathname, search } = req.nextUrl;

  if (isStatic(pathname)) return NextResponse.next();

  // ✅ qualquer dashboard.*.pedidodasorte.com.br
  const isDashboardHost =
    host.startsWith('dashboard.') && host.endsWith('pedidodasorte.com.br');

  if (isDashboardHost) {
    if (pathname.startsWith('/api')) return NextResponse.next();
    if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
      return NextResponse.next();
    }
    const url = req.nextUrl.clone();
    url.pathname = pathname === '/' ? '/dashboard' : `/dashboard${pathname}`;
    url.search = search;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

// matcher que pega tudo exceto _next e favicon (mais robusto)
export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
};
