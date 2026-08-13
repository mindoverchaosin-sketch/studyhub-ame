import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { env } from '@/lib/env'
import { normalizeRoleName } from '@/server/services/authorization.service'
// Note: entitlementService depends on Prisma (Node-only) and cannot be imported
// into Edge runtime middleware. Premium entitlement checks are enforced in
// server-side page handlers. Avoid importing Node-only modules here to keep
// middleware Edge-compatible.

type NormalizedRole = 'STUDENT' | 'ADMIN' | 'INSTRUCTOR' | 'CONTENT_EDITOR' | 'SUPER_ADMIN'

function isPrivilegedRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/instructor') ||
    pathname.startsWith('/content-editor') ||
    pathname.startsWith('/super-admin')
  )
}

function isLoginRoute(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname === '/admin/login' ||
    pathname === '/instructor/login' ||
    pathname === '/content-editor/login' ||
    pathname === '/super-admin/login'
  )
}

export async function middleware(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID()
  const correlationId = request.headers.get('x-correlation-id') || requestId
  const { pathname } = request.nextUrl

  const response = NextResponse.next()
  response.headers.set('x-request-id', requestId)
  response.headers.set('x-correlation-id', correlationId)

  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/public') ||
    isLoginRoute(pathname)
  ) {
    return response
  }

  const token = await getToken({ req: request, secret: env.NEXTAUTH_SECRET })
  const role = typeof token?.role === 'string' ? (normalizeRoleName(token.role) as NormalizedRole) : null
  const isAuthenticated = Boolean(token)

  // Student workspace: only STUDENT role
  if (pathname.startsWith('/student')) {
    if (!isAuthenticated) {
      const redirectResponse = NextResponse.redirect(new URL('/login', request.url))
      redirectResponse.headers.set('x-request-id', requestId)
      return redirectResponse
    }
    if (role !== 'STUDENT') {
      const redirectResponse = NextResponse.redirect(new URL('/unauthorized', request.url))
      redirectResponse.headers.set('x-request-id', requestId)
      return redirectResponse
    }
  }

  // Privileged routes: only specific roles
  if (isPrivilegedRoute(pathname)) {
    if (!isAuthenticated) {
      const loginUrl = pathname.startsWith('/admin')
        ? '/admin/login'
        : pathname.startsWith('/instructor')
          ? '/instructor/login'
          : pathname.startsWith('/content-editor')
            ? '/content-editor/login'
            : '/super-admin/login'
      const redirectResponse = NextResponse.redirect(new URL(loginUrl, request.url))
      redirectResponse.headers.set('x-request-id', requestId)
      return redirectResponse
    }

    // Route-role enforcement: each route requires the exact role
    let isAuthorized = false
    if (pathname.startsWith('/admin') && (role === 'ADMIN' || role === 'SUPER_ADMIN')) {
      isAuthorized = true
    } else if (pathname.startsWith('/instructor') && role === 'INSTRUCTOR') {
      isAuthorized = true
    } else if (pathname.startsWith('/content-editor') && role === 'CONTENT_EDITOR') {
      isAuthorized = true
    } else if (pathname.startsWith('/super-admin') && role === 'SUPER_ADMIN') {
      isAuthorized = true
    }

    if (!isAuthorized) {
      const redirectResponse = NextResponse.redirect(new URL('/unauthorized', request.url))
      redirectResponse.headers.set('x-request-id', requestId)
      return redirectResponse
    }
  }

  return response
}

export const config = {
  matcher: ['/student/:path*', '/admin/:path*', '/instructor/:path*', '/content-editor/:path*', '/super-admin/:path*'],
}
