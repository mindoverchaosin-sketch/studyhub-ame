import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireStudentMock = vi.fn()
const requireAdminMock = vi.fn()
const requireOwnershipMock = vi.fn((resourceUserId: string, currentUserId: string, allowAdmin = false, currentUserRole?: string) => {
  if (allowAdmin && currentUserRole === 'ADMIN') {
    return
  }

  if (resourceUserId !== currentUserId) {
    throw new Error('You can only access your own dashboard data.')
  }
})

vi.mock('@/auth', () => ({
  requireStudent: requireStudentMock,
  requireAdmin: requireAdminMock,
  requireOwnership: requireOwnershipMock,
  ValidationError: class ValidationError extends Error {
    constructor(message = 'Validation failed.') {
      super(message)
      this.name = 'ValidationError'
      ;(this as any).status = 400
    }
  },
  ForbiddenError: class ForbiddenError extends Error {
    constructor(message = 'Access denied.') {
      super(message)
      this.name = 'ForbiddenError'
      ;(this as any).status = 403
    }
  },
  UnauthorizedError: class UnauthorizedError extends Error {
    constructor(message = 'Authentication required.') {
      super(message)
      this.name = 'UnauthorizedError'
      ;(this as any).status = 401
    }
  },
}))

const getDashboardSummaryMock = vi.fn()
vi.mock('@/server/services/dashboard.service', () => ({
  getDashboardSummary: getDashboardSummaryMock,
}))

describe('server action security guards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects mismatched student ids for dashboard access', async () => {
    requireStudentMock.mockResolvedValue({ user: { id: 'student-2' } })

    const { getDashboardSummaryAction } = await import('../../server/actions/dashboard.actions')

    await expect(getDashboardSummaryAction('student-1')).rejects.toThrow('You can only access your own dashboard data.')
    expect(getDashboardSummaryMock).not.toHaveBeenCalled()
  })
})
