// /middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Deixa livre /admin/login e as rotas de API de login/logout
  const isLoginPage = pathname.startsWith('/admin/login')
  const isAuthApi =
    pathname.startsWith('/api/admin/login') || pathname.startsWith('/api/admin/logout')

  if (isLoginPage || isAuthApi) return NextResponse.next()

  if (pathname.startsWith('/admin')) {
    const cookie = req.cookies.get('admin_auth')?.value
    if (cookie !== '1') {
      const url = req.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
