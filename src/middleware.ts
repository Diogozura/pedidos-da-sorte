import { NextRequest, NextResponse } from 'next/server';

function getHost(req: NextRequest): string {
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

  const isDashboardHost =
    host.startsWith('sistema.') && host.endsWith('pedidodasorte.com.br');

  if (isDashboardHost) {
    // 1) Deixa /api e /auth na raiz do subdomínio
    if (pathname.startsWith('/api') || pathname.startsWith('/auth')) {
      return NextResponse.next();
    }

    // 2) Canonicaliza: se vier /dashboard ou /dashboard/*, redireciona sem o prefixo
    if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
      const url = req.nextUrl.clone();
      url.pathname = pathname.replace(/^\/dashboard/, '') || '/';
      return NextResponse.redirect(url, 308);
    }

    // 3) Home "limpa": / → rewrite para /dashboard (URL permanece /)
    if (pathname === '/') {
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard';
      url.search = search;
      return NextResponse.rewrite(url);
    }

    // 4) Qualquer outra rota: /algo → rewrite para /dashboard/algo (URL permanece /algo)
    const url = req.nextUrl.clone();
    url.pathname = `/dashboard${pathname}`;
    url.search = search;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

// pega tudo, exceto estáticos básicos
export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
};
