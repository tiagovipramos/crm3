import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const url = request.nextUrl.clone()
  
  // Detectar subdomínio e fazer rewrite interno
  if (host.startsWith('admin.')) {
    // Se não estiver já na rota /admin, fazer rewrite
    if (!url.pathname.startsWith('/admin')) {
      url.pathname = `/admin${url.pathname}`
      return NextResponse.rewrite(url)
    }
  }
  
  if (host.startsWith('crm.')) {
    // Se não estiver já na rota /crm, fazer rewrite
    if (!url.pathname.startsWith('/crm')) {
      url.pathname = `/crm${url.pathname}`
      return NextResponse.rewrite(url)
    }
  }
  
  if (host.startsWith('indicador.')) {
    // Se não estiver já na rota /indicador, fazer rewrite
    if (!url.pathname.startsWith('/indicador')) {
      url.pathname = `/indicador${url.pathname}`
      return NextResponse.rewrite(url)
    }
  }
  
  return NextResponse.next()
}

// Configurar matcher para aplicar middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
