import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''

  // Quando acessar sorteio.pedidosdasorte.com
  if (hostname.startsWith('sorteio.pedidosdasorte.com')) {
    // Força sempre ir para /sorteio
    return NextResponse.rewrite(new URL('/sorteio', request.url))
  }

  // Senão segue o fluxo normal
  return NextResponse.next()
}
