import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // Garante que qualquer rota do subdomínio sorteio vá para /sorteio
  if (hostname === 'sorteio.pedidodasorte.com.br' && pathname !== '/sorteio') {
    const url = request.nextUrl.clone()
    url.pathname = '/sorteio'
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}
