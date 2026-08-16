import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockRequireAuth = vi.fn()
const mockRequirePermission = vi.fn()
const mockForbiddenError = vi.fn()
const mockValidationError = vi.fn()
const mockNotFoundError = vi.fn()

vi.mock('@/auth', () => ({
  requireAuth: mockRequireAuth,
  requirePermission: mockRequirePermission,
  ForbiddenError: class ForbiddenError extends Error {
    constructor(message = 'Forbidden') {
      super(message)
      this.name = 'ForbiddenError'
    }
  },
  ValidationError: class ValidationError extends Error {
    constructor(message = 'Validation failed') {
      super(message)
      this.name = 'ValidationError'
    }
  },
  NotFoundError: class NotFoundError extends Error {
    constructor(message = 'Not found') {
      super(message)
      this.name = 'NotFoundError'
    }
  },
}))

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  adminProfile: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  instructorProfile: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}

vi.mock('@/lib/prisma', () => ({
  default: mockPrisma,
}))

describe('approval management backend', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequirePermission.mockReset()
  })

  it('allows a super admin to approve an admin', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'super-1', role: 'SUPER_ADMIN' } })
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@example.com',
      isActive: true,
      role: { name: 'ADMIN' },
      adminProfile: { userId: 'admin-1', status: 'PENDING' },
    })
    mockPrisma.adminProfile.findUnique.mockResolvedValue({ userId: 'admin-1', status: 'PENDING' })
    mockPrisma.adminProfile.update.mockResolvedValue({
      userId: 'admin-1',
      status: 'APPROVED',
      approvedById: 'super-1',
      approvedAt: new Date(),
    })

    const { approveAdmin } = await import('@/server/services/approval-management.service')
    await expect(approveAdmin('admin-1')).resolves.toMatchObject({ status: 'APPROVED' })
    expect(mockPrisma.adminProfile.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'admin-1' },
      data: expect.objectContaining({ status: 'APPROVED', approvedById: 'super-1', approvedAt: expect.any(Date) }),
    }))
  })

  it('allows a super admin to reject an admin', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'super-1', role: 'SUPER_ADMIN' } })
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'admin-2',
      email: 'admin2@example.com',
      isActive: true,
      role: { name: 'ADMIN' },
      adminProfile: { userId: 'admin-2', status: 'PENDING' },
    })
    mockPrisma.adminProfile.findUnique.mockResolvedValue({ userId: 'admin-2', status: 'PENDING' })
    mockPrisma.adminProfile.update.mockResolvedValue({
      userId: 'admin-2',
      status: 'REJECTED',
      approvedById: 'super-1',
      approvedAt: new Date(),
    })

    const { rejectAdmin } = await import('@/server/services/approval-management.service')
    await expect(rejectAdmin('admin-2')).resolves.toMatchObject({ status: 'REJECTED' })
    expect(mockPrisma.adminProfile.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'REJECTED', approvedById: 'super-1' }),
    }))
  })

  it('allows a super admin to suspend an admin', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'super-1', role: 'SUPER_ADMIN' } })
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'admin-3',
      email: 'admin3@example.com',
      isActive: true,
      role: { name: 'ADMIN' },
      adminProfile: { userId: 'admin-3', status: 'APPROVED' },
    })
    mockPrisma.adminProfile.findUnique.mockResolvedValue({ userId: 'admin-3', status: 'APPROVED' })
    mockPrisma.adminProfile.update.mockResolvedValue({
      userId: 'admin-3',
      status: 'SUSPENDED',
      approvedById: 'super-1',
      approvedAt: new Date(),
    })

    const { suspendAdmin } = await import('@/server/services/approval-management.service')
    await expect(suspendAdmin('admin-3')).resolves.toMatchObject({ status: 'SUSPENDED' })
    expect(mockPrisma.adminProfile.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'SUSPENDED', approvedById: 'super-1' }),
    }))
  })

  it('allows a super admin to reactivate an admin', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'super-1', role: 'SUPER_ADMIN' } })
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'admin-4',
      email: 'admin4@example.com',
      isActive: true,
      role: { name: 'ADMIN' },
      adminProfile: { userId: 'admin-4', status: 'SUSPENDED' },
    })
    mockPrisma.adminProfile.findUnique.mockResolvedValue({ userId: 'admin-4', status: 'SUSPENDED' })
    mockPrisma.adminProfile.update.mockResolvedValue({
      userId: 'admin-4',
      status: 'APPROVED',
      approvedById: 'super-1',
      approvedAt: new Date(),
    })

    const { reactivateAdmin } = await import('@/server/services/approval-management.service')
    await expect(reactivateAdmin('admin-4')).resolves.toMatchObject({ status: 'APPROVED' })
    expect(mockPrisma.adminProfile.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'APPROVED', approvedById: 'super-1' }),
    }))
  })

  it.each(['approveAdmin', 'rejectAdmin', 'suspendAdmin', 'reactivateAdmin'])('admin cannot manage another admin through %s', async (methodName) => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } })
    const approvalModule = await import('@/server/services/approval-management.service') as Record<string, (userId: string) => Promise<unknown>>
    const method = approvalModule[methodName]

    await expect((method as (userId: string) => Promise<unknown>)('admin-2')).rejects.toThrow('Only SUPER_ADMIN may manage ADMIN approval status.')
  })

  it.each(['CONTENT_EDITOR', 'STUDENT'])('role %s cannot manage admin approval', async (role) => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'actor-1', role } })
    const { approveAdmin } = await import('@/server/services/approval-management.service')

    await expect(approveAdmin('admin-2')).rejects.toThrow('Only SUPER_ADMIN may manage ADMIN approval status.')
  })

  it('denies admin self-approval', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'SUPER_ADMIN' } })

    const { approveAdmin } = await import('@/server/services/approval-management.service')
    await expect(approveAdmin('admin-1')).rejects.toThrow('Admin cannot approve themselves.')
  })

  it('denies instructor self-approval', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'instructor-1', role: 'ADMIN' } })

    const { approveInstructor } = await import('@/server/services/approval-management.service')
    await expect(approveInstructor('instructor-1')).rejects.toThrow('Instructor cannot approve themselves.')
  })

  it('denies instructor approval by content editor', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'editor-1', role: 'CONTENT_EDITOR' } })

    const { approveInstructor } = await import('@/server/services/approval-management.service')
    await expect(approveInstructor('instructor-1')).rejects.toThrow('Only ADMIN or SUPER_ADMIN')
  })

  it('denies instructor approval by student', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'student-1', role: 'STUDENT' } })

    const { approveInstructor } = await import('@/server/services/approval-management.service')
    await expect(approveInstructor('instructor-1')).rejects.toThrow('Only ADMIN or SUPER_ADMIN')
  })

  it('allows admin to approve an instructor', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } })
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'instructor-1',
      email: 'instructor@example.com',
      isActive: true,
      role: { name: 'INSTRUCTOR' },
      instructorProfile: { userId: 'instructor-1', status: 'PENDING' },
    })
    mockPrisma.instructorProfile.findUnique.mockResolvedValue({ userId: 'instructor-1', status: 'PENDING' })
    mockPrisma.instructorProfile.update.mockResolvedValue({
      userId: 'instructor-1',
      status: 'APPROVED',
      approvedById: 'admin-1',
      approvedAt: new Date(),
    })

    const { approveInstructor } = await import('@/server/services/approval-management.service')
    await expect(approveInstructor('instructor-1')).resolves.toMatchObject({ status: 'APPROVED' })
    expect(mockPrisma.instructorProfile.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'instructor-1' },
      data: expect.objectContaining({ status: 'APPROVED', approvedById: 'admin-1', approvedAt: expect.any(Date) }),
    }))
  })

  it('allows admin to reject an instructor', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } })
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'instructor-2',
      email: 'instructor2@example.com',
      isActive: true,
      role: { name: 'INSTRUCTOR' },
      instructorProfile: { userId: 'instructor-2', status: 'PENDING' },
    })
    mockPrisma.instructorProfile.findUnique.mockResolvedValue({ userId: 'instructor-2', status: 'PENDING' })
    mockPrisma.instructorProfile.update.mockResolvedValue({
      userId: 'instructor-2',
      status: 'REJECTED',
      approvedById: 'admin-1',
      approvedAt: new Date(),
    })

    const { rejectInstructor } = await import('@/server/services/approval-management.service')
    await expect(rejectInstructor('instructor-2')).resolves.toMatchObject({ status: 'REJECTED' })
    expect(mockPrisma.instructorProfile.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'REJECTED', approvedById: 'admin-1' }),
    }))
  })

  it('allows admin to suspend an instructor', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } })
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'instructor-3',
      email: 'instructor3@example.com',
      isActive: true,
      role: { name: 'INSTRUCTOR' },
      instructorProfile: { userId: 'instructor-3', status: 'APPROVED' },
    })
    mockPrisma.instructorProfile.findUnique.mockResolvedValue({ userId: 'instructor-3', status: 'APPROVED' })
    mockPrisma.instructorProfile.update.mockResolvedValue({
      userId: 'instructor-3',
      status: 'SUSPENDED',
      approvedById: 'admin-1',
      approvedAt: new Date(),
    })

    const { suspendInstructor } = await import('@/server/services/approval-management.service')
    await expect(suspendInstructor('instructor-3')).resolves.toMatchObject({ status: 'SUSPENDED' })
    expect(mockPrisma.instructorProfile.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'SUSPENDED', approvedById: 'admin-1' }),
    }))
  })

  it('allows admin to reactivate an instructor', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } })
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'instructor-4',
      email: 'instructor4@example.com',
      isActive: true,
      role: { name: 'INSTRUCTOR' },
      instructorProfile: { userId: 'instructor-4', status: 'SUSPENDED' },
    })
    mockPrisma.instructorProfile.findUnique.mockResolvedValue({ userId: 'instructor-4', status: 'SUSPENDED' })
    mockPrisma.instructorProfile.update.mockResolvedValue({
      userId: 'instructor-4',
      status: 'APPROVED',
      approvedById: 'admin-1',
      approvedAt: new Date(),
    })

    const { reactivateInstructor } = await import('@/server/services/approval-management.service')
    await expect(reactivateInstructor('instructor-4')).resolves.toMatchObject({ status: 'APPROVED' })
    expect(mockPrisma.instructorProfile.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'APPROVED', approvedById: 'admin-1' }),
    }))
  })

  it('allows a super admin to perform instructor approval transitions', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'super-1', role: 'SUPER_ADMIN' } })
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'instructor-5',
      email: 'instructor5@example.com',
      isActive: true,
      role: { name: 'INSTRUCTOR' },
      instructorProfile: { userId: 'instructor-5', status: 'PENDING' },
    })
    mockPrisma.instructorProfile.findUnique.mockResolvedValue({ userId: 'instructor-5', status: 'PENDING' })
    mockPrisma.instructorProfile.update.mockResolvedValue({
      userId: 'instructor-5',
      status: 'APPROVED',
      approvedById: 'super-1',
      approvedAt: new Date(),
    })

    const { approveInstructor } = await import('@/server/services/approval-management.service')
    await expect(approveInstructor('instructor-5')).resolves.toMatchObject({ status: 'APPROVED' })
    expect(mockPrisma.instructorProfile.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'APPROVED', approvedById: 'super-1' }),
    }))
  })

  it('rejects wrong target role for admin approval', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'super-1', role: 'SUPER_ADMIN' } })
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'student-1',
      email: 'student@example.com',
      isActive: true,
      role: { name: 'STUDENT' },
    })

    const { approveAdmin } = await import('@/server/services/approval-management.service')
    await expect(approveAdmin('student-1')).rejects.toThrow('Approved target must have the ADMIN role.')
  })

  it('rejects wrong target role for instructor approval', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } })
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'admin-9',
      email: 'admin9@example.com',
      isActive: true,
      role: { name: 'ADMIN' },
    })

    const { approveInstructor } = await import('@/server/services/approval-management.service')
    await expect(approveInstructor('admin-9')).rejects.toThrow('Approved target must have the INSTRUCTOR role.')
  })

  it('rejects admin approval when the approval profile is missing', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'super-1', role: 'SUPER_ADMIN' } })
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'admin-10',
      email: 'admin10@example.com',
      isActive: true,
      role: { name: 'ADMIN' },
      adminProfile: null,
    })

    const { approveAdmin } = await import('@/server/services/approval-management.service')
    await expect(approveAdmin('admin-10')).rejects.toThrow('Admin profile not found for this user.')
  })

  it('rejects instructor approval when the approval profile is missing', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } })
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'instructor-10',
      email: 'instructor10@example.com',
      isActive: true,
      role: { name: 'INSTRUCTOR' },
      instructorProfile: null,
    })

    const { approveInstructor } = await import('@/server/services/approval-management.service')
    await expect(approveInstructor('instructor-10')).rejects.toThrow('Instructor profile not found for this user.')
  })

  it('rejects approval requests from an inactive caller', async () => {
    mockRequireAuth.mockRejectedValue(new Error('Authentication required'))

    const { approveAdmin } = await import('@/server/services/approval-management.service')
    await expect(approveAdmin('admin-2')).rejects.toThrow('Authentication required')
  })

  it('blocks direct server-action invocation when permission checks fail', async () => {
    mockRequireAuth.mockResolvedValue({ user: { id: 'super-1', role: 'SUPER_ADMIN' } })
    mockRequirePermission.mockRejectedValue(new Error('Permission required'))

    const { approveAdminAction, approveInstructorAction } = await import('@/server/actions/approval-management.actions')
    await expect(approveAdminAction('admin-2')).rejects.toThrow('Permission required')
    await expect(approveInstructorAction('instructor-2')).rejects.toThrow('Permission required')
  })

  it('blocks student mutation through the permission gate', async () => {
    vi.resetModules()
    const requirePermissionMock = vi.fn().mockRejectedValue(new Error('Permission required'))
    vi.doMock('@/auth', () => ({
      requirePermission: requirePermissionMock,
      requireAuth: vi.fn(),
      ForbiddenError: class ForbiddenError extends Error {
        constructor(message = 'Forbidden') { super(message); this.name = 'ForbiddenError' }
      },
      ValidationError: class ValidationError extends Error {
        constructor(message = 'Validation failed') { super(message); this.name = 'ValidationError' }
      },
      NotFoundError: class NotFoundError extends Error {
        constructor(message = 'Not found') { super(message); this.name = 'NotFoundError' }
      },
    }))

    const { createQuestionAction } = await import('@/server/actions/question-management.actions')
    await expect(createQuestionAction({} as any)).rejects.toThrow('Permission required')
  })
})
