import { beforeEach, describe, expect, it, vi } from 'vitest'

const requirePermissionMock = vi.hoisted(() => vi.fn())

// Classes must live inside vi.hoisted so the vi.mock factory can reference them.
const { UnauthorizedError, ForbiddenError } = vi.hoisted(() => ({
  UnauthorizedError: class UnauthorizedError extends Error {
    constructor(message = 'Authentication required.') {
      super(message)
      this.name = 'UnauthorizedError'
    }
  },
  ForbiddenError: class ForbiddenError extends Error {
    constructor(message = 'Access denied.') {
      super(message)
      this.name = 'ForbiddenError'
    }
  },
}))

vi.mock('@/auth', () => ({
  requirePermission: requirePermissionMock,
  UnauthorizedError,
  ForbiddenError,
}))

vi.mock('@/lib/request-logger', () => ({
  withRequestLogging: (_request: unknown, _name: string, handler: () => Promise<unknown>) => handler(),
}))

vi.mock('@/server/services/metrics.service', () => ({
  metricsService: {
    getSnapshot: vi.fn(() => ({ requests: { total: 42 }, services: {} })),
  },
}))

import { GET } from '@/app/api/metrics/route'

describe('GET /api/metrics security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated access with 401', async () => {
    requirePermissionMock.mockRejectedValue(new UnauthorizedError())

    const response = await GET()

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(requirePermissionMock).toHaveBeenCalledWith('viewAnalytics')
  })

  it('rejects authenticated non-privileged users with 403', async () => {
    requirePermissionMock.mockRejectedValue(new ForbiddenError())

    const response = await GET()

    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.success).toBe(false)
  })

  it('still serves the snapshot to authorized admins', async () => {
    requirePermissionMock.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } })

    const response = await GET()

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.requests.total).toBe(42)
    expect(requirePermissionMock).toHaveBeenCalledWith('viewAnalytics')
  })

  it('maps unexpected guard failures to a thrown error', async () => {
    requirePermissionMock.mockRejectedValue(new Error('db down'))

    await expect(GET()).rejects.toThrow('db down')
  })
})
