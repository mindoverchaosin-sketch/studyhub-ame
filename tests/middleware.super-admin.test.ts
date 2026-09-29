import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockGetToken } = vi.hoisted(() => ({ mockGetToken: vi.fn() }))

vi.mock('next-auth/jwt', () => ({ getToken: mockGetToken }))
vi.mock('@/lib/env', () => ({ env: { NEXTAUTH_SECRET: 'test-secret' } }))

import { middleware } from '@/middleware'

function createRequest() {
  return new NextRequest('http://localhost/super-admin/dashboard')
}

describe('Super Admin route authorization middleware', () => {
  beforeEach(() => {
    mockGetToken.mockReset()
  })

  it.each(['STUDENT', 'CONTENT_EDITOR', 'ADMIN'])('redirects %s away from the Super Admin portal', async (role) => {
    mockGetToken.mockResolvedValue({ role })
    const request = createRequest()

    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(new URL('/unauthorized', request.url).toString())
  })

  it('redirects unauthenticated requests to Super Admin sign-in', async () => {
    mockGetToken.mockResolvedValue(null)
    const request = createRequest()

    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(new URL('/super-admin/login', request.url).toString())
  })

  it('allows SUPER_ADMIN requests through the route boundary', async () => {
    mockGetToken.mockResolvedValue({ role: 'SUPER_ADMIN' })

    const response = await middleware(createRequest())

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
  })
})