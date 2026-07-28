import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
export async function middleware(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID()
  const { pathname } = request.nextUrl

  const response = NextResponse.next()
  response.headers.set('x-request-id', requestId)

  if (pathname.startsWith('/api/auth') || pathname.startsWith('/_next')) {
    return response
  }

  const cookies = request.cookies
  const sessionCookie = cookies.get('next-auth.session-token') || cookies.get('__Secure-next-auth.session-token')
  const isAuthenticated = Boolean(sessionCookie)

  if (pathname.startsWith('/student')) {
    if (!isAuthenticated) {
      const redirectResponse = NextResponse.redirect(new URL('/login', request.url))
      redirectResponse.headers.set('x-request-id', requestId)
      return redirectResponse
    }
  }

  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const redirectResponse = NextResponse.redirect(new URL('/login', request.url))
      redirectResponse.headers.set('x-request-id', requestId)
      return redirectResponse
    }
  }

  return response
}

export const config = {
  matcher: ['/student/:path*', '/admin/:path*'],
}
