import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/auth') || pathname.startsWith('/_next')) {
    return NextResponse.next()
  }

  const cookies = request.cookies
  const sessionCookie = cookies.get('next-auth.session-token') || cookies.get('__Secure-next-auth.session-token')
  const isAuthenticated = Boolean(sessionCookie)

  if (pathname.startsWith('/student')) {
    if (!isAuthenticated) return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/student/:path*', '/admin/:path*'],
}
