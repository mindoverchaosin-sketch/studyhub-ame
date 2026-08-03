import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { normalizeRoleName } from '@/server/services/authorization.service'

const adminRoutes = ['/admin', '/admin/analytics', '/admin/audit-logs', '/admin/billing', '/admin/courses', '/admin/lessons', '/admin/materials', '/admin/mock-tests', '/admin/modules', '/admin/questions', '/admin/students', '/admin/users', '/admin/settings']
const studentRoutes = ['/student']

function isAdminRoute(pathname: string) {
  return pathname === '/admin' || adminRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

function isStudentRoute(pathname: string) {
  return pathname === '/student' || studentRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export async function middleware(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID()
  const correlationId = request.headers.get('x-correlation-id') || requestId
  const { pathname } = request.nextUrl

  const response = NextResponse.next()
  response.headers.set('x-request-id', requestId)
  response.headers.set('x-correlation-id', correlationId)

  if (pathname.startsWith('/api/auth') || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return response
  }

  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET || 'development-secret' })
  const role = typeof token?.role === 'string' ? token.role : undefined
  const isAuthenticated = Boolean(token)

  if (pathname.startsWith('/student')) {
    if (!isAuthenticated) {
      const redirectResponse = NextResponse.redirect(new URL('/login', request.url))
      redirectResponse.headers.set('x-request-id', requestId)
      return redirectResponse
    }

    if (normalizeRoleName(role) !== 'STUDENT') {
      const redirectResponse = NextResponse.redirect(new URL('/unauthorized', request.url))
      redirectResponse.headers.set('x-request-id', requestId)
      return redirectResponse
    }
  }

  if (isAdminRoute(pathname)) {
    if (!isAuthenticated) {
      const redirectResponse = NextResponse.redirect(new URL('/login', request.url))
      redirectResponse.headers.set('x-request-id', requestId)
      return redirectResponse
    }

    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'CONTENT_EDITOR', 'INSTRUCTOR']
    if (!allowedRoles.includes(normalizeRoleName(role))) {
      const redirectResponse = NextResponse.redirect(new URL('/unauthorized', request.url))
      redirectResponse.headers.set('x-request-id', requestId)
      return redirectResponse
    }
  }

  if (isStudentRoute(pathname) && pathname.startsWith('/admin')) {
    return response
  }

  return response
}

export const config = {
  matcher: ['/student/:path*', '/admin/:path*'],
}
