import { beforeEach, describe, expect, it, vi } from 'vitest'

class ForbiddenError extends Error {
  constructor(message = 'Access denied.') {
    super(message)
    this.name = 'ForbiddenError'
    ;(this as any).status = 403
  }
}

const mockRequireAuth = vi.fn()
const mockRequireApprovedRole = vi.fn()

vi.mock('@/auth', () => ({
  requireAuth: mockRequireAuth,
  requireApprovedRole: mockRequireApprovedRole,
  ForbiddenError,
}))

const mockWithAuditLogging = vi.fn(async (config) => config.run())

vi.mock('@/server/actions/audit-helpers', () => ({
  withAuditLogging: mockWithAuditLogging,
}))

const mockApprovalService = {
  getAdminsByStatus: vi.fn(),
  approveAdmin: vi.fn(),
  rejectAdmin: vi.fn(),
  suspendAdmin: vi.fn(),
  reactivateAdmin: vi.fn(),
  getInstructorsByStatus: vi.fn(),
  approveInstructor: vi.fn(),
  rejectInstructor: vi.fn(),
  suspendInstructor: vi.fn(),
  reactivateInstructor: vi.fn(),
}

vi.mock('@/server/services/approval-management.service', () => mockApprovalService)

describe('Approval Management Actions - Authorization Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockReset()
    mockRequireApprovedRole.mockReset()
  })

  describe('getAdminsByStatusAction - SUPER_ADMIN only', () => {
    it('allows APPROVED SUPER_ADMIN', async () => {
      const { getAdminsByStatusAction } = await import(
        '@/server/actions/approval-management.actions'
      )
      const superAdminSession = { user: { id: '1', role: 'SUPER_ADMIN' } }

      mockRequireApprovedRole.mockResolvedValue(superAdminSession)
      mockApprovalService.getAdminsByStatus.mockResolvedValue([])

      const result = await getAdminsByStatusAction('PENDING')

      expect(mockRequireApprovedRole).toHaveBeenCalledWith('SUPER_ADMIN')
      expect(mockApprovalService.getAdminsByStatus).toHaveBeenCalledWith('PENDING')
      expect(result).toEqual([])
    })

    it('requires authentication before listing admins', async () => {
      const { getAdminsByStatusAction } = await import(
        '@/server/actions/approval-management.actions'
      )

      mockRequireApprovedRole.mockRejectedValue(new Error('Authentication required.'))

      await expect(getAdminsByStatusAction('ALL')).rejects.toThrow('Authentication required.')
      expect(mockApprovalService.getAdminsByStatus).not.toHaveBeenCalled()
    })

    it('denies PENDING ADMIN', async () => {
      const { getAdminsByStatusAction } = await import(
        '@/server/actions/approval-management.actions'
      )

      mockRequireApprovedRole.mockRejectedValue(
        new Error('Admin access is pending approval or suspended.')
      )

      await expect(getAdminsByStatusAction('PENDING')).rejects.toThrow(
        'Admin access is pending approval or suspended.'
      )
      expect(mockRequireApprovedRole).toHaveBeenCalledWith('SUPER_ADMIN')
      expect(mockApprovalService.getAdminsByStatus).not.toHaveBeenCalled()
    })

    it('denies REJECTED ADMIN', async () => {
      const { getAdminsByStatusAction } = await import(
        '@/server/actions/approval-management.actions'
      )

      mockRequireApprovedRole.mockRejectedValue(
        new Error('Admin access is pending approval or suspended.')
      )

      await expect(getAdminsByStatusAction('PENDING')).rejects.toThrow()
      expect(mockApprovalService.getAdminsByStatus).not.toHaveBeenCalled()
    })

    it('denies SUSPENDED ADMIN', async () => {
      const { getAdminsByStatusAction } = await import(
        '@/server/actions/approval-management.actions'
      )

      mockRequireApprovedRole.mockRejectedValue(
        new Error('Admin access is pending approval or suspended.')
      )

      await expect(getAdminsByStatusAction('PENDING')).rejects.toThrow()
      expect(mockApprovalService.getAdminsByStatus).not.toHaveBeenCalled()
    })

    it('denies STUDENT role', async () => {
      const { getAdminsByStatusAction } = await import(
        '@/server/actions/approval-management.actions'
      )

      mockRequireApprovedRole.mockRejectedValue(
        new Error('SUPER_ADMIN access required.')
      )

      await expect(getAdminsByStatusAction('PENDING')).rejects.toThrow(
        'SUPER_ADMIN access required.'
      )
      expect(mockApprovalService.getAdminsByStatus).not.toHaveBeenCalled()
    })

    it('denies ADMIN role from admin approval listing', async () => {
      const { getAdminsByStatusAction } = await import(
        '@/server/actions/approval-management.actions'
      )

      mockRequireApprovedRole.mockRejectedValue(new ForbiddenError('SUPER_ADMIN access required.'))

      await expect(getAdminsByStatusAction('ALL')).rejects.toThrow(ForbiddenError)
      expect(mockApprovalService.getAdminsByStatus).not.toHaveBeenCalled()
    })
  })

  describe('approveAdminAction - SUPER_ADMIN only', () => {
    it('allows SUPER_ADMIN to approve admin through the audited wrapper', async () => {
      const { approveAdminAction } = await import(
        '@/server/actions/approval-management.actions'
      )
      const superAdminSession = { user: { id: '1', role: 'SUPER_ADMIN' } }

      mockRequireApprovedRole.mockResolvedValue(superAdminSession)
      mockApprovalService.approveAdmin.mockResolvedValue({
        id: '2',
        status: 'APPROVED',
      })

      const result = await approveAdminAction('admin-id')

      expect(mockRequireApprovedRole).toHaveBeenCalledWith('SUPER_ADMIN')
      expect(mockWithAuditLogging).toHaveBeenCalledWith(
        expect.objectContaining({
          permission: 'manageUsers',
          action: 'admin.approve',
          entityType: 'ADMIN',
          entityId: 'admin-id',
          metadata: { source: 'approval-management' },
        })
      )
      expect(mockApprovalService.approveAdmin).toHaveBeenCalledWith('admin-id')
      expect(result).toEqual({ id: '2', status: 'APPROVED' })
    })

    it('denies APPROVED ADMIN trying to approve another admin', async () => {
      const { approveAdminAction } = await import(
        '@/server/actions/approval-management.actions'
      )

      mockRequireApprovedRole.mockRejectedValue(new ForbiddenError('SUPER_ADMIN access required.'))

      await expect(approveAdminAction('admin-id')).rejects.toThrow(ForbiddenError)
      expect(mockWithAuditLogging).not.toHaveBeenCalled()
      expect(mockApprovalService.approveAdmin).not.toHaveBeenCalled()
    })

    it('propagates missing target errors from the service', async () => {
      const { approveAdminAction } = await import(
        '@/server/actions/approval-management.actions'
      )
      const superAdminSession = { user: { id: '1', role: 'SUPER_ADMIN' } }

      mockRequireApprovedRole.mockResolvedValue(superAdminSession)
      mockApprovalService.approveAdmin.mockRejectedValue(new Error('Target admin not found.'))

      await expect(approveAdminAction('missing-admin')).rejects.toThrow('Target admin not found.')
    })
  })

  describe('rejectAdminAction - SUPER_ADMIN only', () => {
    it('runs the reject workflow under manageUsers audit scope', async () => {
      const { rejectAdminAction } = await import(
        '@/server/actions/approval-management.actions'
      )
      const superAdminSession = { user: { id: '1', role: 'SUPER_ADMIN' } }

      mockRequireApprovedRole.mockResolvedValue(superAdminSession)
      mockApprovalService.rejectAdmin.mockResolvedValue({ id: '2', status: 'REJECTED' })

      const result = await rejectAdminAction('admin-id')

      expect(mockWithAuditLogging).toHaveBeenCalledWith(
        expect.objectContaining({
          permission: 'manageUsers',
          action: 'admin.reject',
          entityType: 'ADMIN',
          entityId: 'admin-id',
        })
      )
      expect(mockApprovalService.rejectAdmin).toHaveBeenCalledWith('admin-id')
      expect(result).toEqual({ id: '2', status: 'REJECTED' })
    })

    it('denies non-SUPER_ADMIN actors', async () => {
      const { rejectAdminAction } = await import(
        '@/server/actions/approval-management.actions'
      )

      mockRequireApprovedRole.mockRejectedValue(new ForbiddenError('SUPER_ADMIN access required.'))

      await expect(rejectAdminAction('admin-id')).rejects.toThrow(ForbiddenError)
      expect(mockApprovalService.rejectAdmin).not.toHaveBeenCalled()
    })
  })

  describe('suspendAdminAction and reactivateAdminAction - SUPER_ADMIN only', () => {
    it('suspends an admin with audit metadata', async () => {
      const { suspendAdminAction } = await import(
        '@/server/actions/approval-management.actions'
      )
      const superAdminSession = { user: { id: '1', role: 'SUPER_ADMIN' } }

      mockRequireApprovedRole.mockResolvedValue(superAdminSession)
      mockApprovalService.suspendAdmin.mockResolvedValue({ id: '2', status: 'SUSPENDED' })

      await suspendAdminAction('admin-id')

      expect(mockWithAuditLogging).toHaveBeenCalledWith(
        expect.objectContaining({
          permission: 'manageUsers',
          action: 'admin.suspend',
          entityType: 'ADMIN',
          entityId: 'admin-id',
        })
      )
      expect(mockApprovalService.suspendAdmin).toHaveBeenCalledWith('admin-id')
    })

    it('reactivates an admin with audit metadata', async () => {
      const { reactivateAdminAction } = await import(
        '@/server/actions/approval-management.actions'
      )
      const superAdminSession = { user: { id: '1', role: 'SUPER_ADMIN' } }

      mockRequireApprovedRole.mockResolvedValue(superAdminSession)
      mockApprovalService.reactivateAdmin.mockResolvedValue({ id: '2', status: 'APPROVED' })

      await reactivateAdminAction('admin-id')

      expect(mockWithAuditLogging).toHaveBeenCalledWith(
        expect.objectContaining({
          permission: 'manageUsers',
          action: 'admin.reactivate',
          entityType: 'ADMIN',
          entityId: 'admin-id',
        })
      )
      expect(mockApprovalService.reactivateAdmin).toHaveBeenCalledWith('admin-id')
    })
  })

  describe('getInstructorsByStatusAction - ADMIN/SUPER_ADMIN', () => {
    it('requires authentication first', async () => {
      const { getInstructorsByStatusAction } = await import(
        '@/server/actions/approval-management.actions'
      )

      mockRequireAuth.mockRejectedValue(new Error('Authentication required.'))

      await expect(getInstructorsByStatusAction('PENDING')).rejects.toThrow('Authentication required.')
      expect(mockRequireApprovedRole).not.toHaveBeenCalled()
      expect(mockApprovalService.getInstructorsByStatus).not.toHaveBeenCalled()
    })

    it('allows APPROVED ADMIN', async () => {
      const { getInstructorsByStatusAction } = await import(
        '@/server/actions/approval-management.actions'
      )
      const adminSession = { user: { id: '1', role: 'ADMIN' } }

      mockRequireAuth.mockResolvedValue(adminSession)
      mockRequireApprovedRole.mockResolvedValue(adminSession)
      mockApprovalService.getInstructorsByStatus.mockResolvedValue([])

      const result = await getInstructorsByStatusAction('PENDING')

      expect(mockRequireAuth).toHaveBeenCalled()
      expect(mockRequireApprovedRole).toHaveBeenCalledWith('ADMIN')
      expect(mockApprovalService.getInstructorsByStatus).toHaveBeenCalledWith('PENDING')
      expect(result).toEqual([])
    })

    it('allows SUPER_ADMIN without admin approval profile', async () => {
      const { getInstructorsByStatusAction } = await import(
        '@/server/actions/approval-management.actions'
      )
      const superAdminSession = { user: { id: '1', role: 'SUPER_ADMIN' } }

      mockRequireAuth.mockResolvedValue(superAdminSession)
      mockRequireApprovedRole.mockResolvedValue(superAdminSession)
      mockApprovalService.getInstructorsByStatus.mockResolvedValue([])

      const result = await getInstructorsByStatusAction('PENDING')

      expect(mockRequireAuth).toHaveBeenCalled()
      expect(mockRequireApprovedRole).toHaveBeenCalledWith('SUPER_ADMIN')
      expect(result).toEqual([])
    })

    it('denies PENDING ADMIN', async () => {
      const { getInstructorsByStatusAction } = await import(
        '@/server/actions/approval-management.actions'
      )
      const pendingAdminSession = { user: { id: '1', role: 'ADMIN' } }

      mockRequireAuth.mockResolvedValue(pendingAdminSession)
      mockRequireApprovedRole.mockRejectedValue(
        new ForbiddenError('Admin access is pending approval or suspended.')
      )

      await expect(getInstructorsByStatusAction('PENDING')).rejects.toThrow(ForbiddenError)
      expect(mockRequireAuth).toHaveBeenCalled()
      expect(mockRequireApprovedRole).toHaveBeenCalledWith('ADMIN')
      expect(mockApprovalService.getInstructorsByStatus).not.toHaveBeenCalled()
    })

    it('denies REJECTED ADMIN', async () => {
      const { getInstructorsByStatusAction } = await import(
        '@/server/actions/approval-management.actions'
      )
      const rejectedAdminSession = { user: { id: '1', role: 'ADMIN' } }

      mockRequireAuth.mockResolvedValue(rejectedAdminSession)
      mockRequireApprovedRole.mockRejectedValue(
        new ForbiddenError('Admin access is pending approval or suspended.')
      )

      await expect(getInstructorsByStatusAction('PENDING')).rejects.toThrow(ForbiddenError)
      expect(mockApprovalService.getInstructorsByStatus).not.toHaveBeenCalled()
    })

    it('denies SUSPENDED ADMIN', async () => {
      const { getInstructorsByStatusAction } = await import(
        '@/server/actions/approval-management.actions'
      )
      const suspendedAdminSession = { user: { id: '1', role: 'ADMIN' } }

      mockRequireAuth.mockResolvedValue(suspendedAdminSession)
      mockRequireApprovedRole.mockRejectedValue(
        new ForbiddenError('Admin access is pending approval or suspended.')
      )

      await expect(getInstructorsByStatusAction('PENDING')).rejects.toThrow(ForbiddenError)
      expect(mockApprovalService.getInstructorsByStatus).not.toHaveBeenCalled()
    })

    it('rejects STUDENT role before any approval-profile lookup', async () => {
      const { getInstructorsByStatusAction } = await import(
        '@/server/actions/approval-management.actions'
      )
      const studentSession = { user: { id: '1', role: 'STUDENT' } }

      mockRequireAuth.mockResolvedValue(studentSession)

      await expect(getInstructorsByStatusAction('PENDING')).rejects.toThrow(
        'Only ADMIN or SUPER_ADMIN may manage instructor approval.'
      )
      expect(mockRequireApprovedRole).not.toHaveBeenCalled()
      expect(mockApprovalService.getInstructorsByStatus).not.toHaveBeenCalled()
    })

    it('rejects INSTRUCTOR role from managing instructor approval', async () => {
      const { suspendInstructorAction } = await import(
        '@/server/actions/approval-management.actions'
      )
      const instructorSession = { user: { id: '3', role: 'INSTRUCTOR' } }

      mockRequireAuth.mockResolvedValue(instructorSession)

      await expect(suspendInstructorAction('instructor-2')).rejects.toThrow(
        'Only ADMIN or SUPER_ADMIN may manage instructor approval.'
      )
      expect(mockApprovalService.suspendInstructor).not.toHaveBeenCalled()
    })
  })

  describe('approveInstructorAction - ADMIN/SUPER_ADMIN', () => {
    it('allows APPROVED ADMIN to approve instructor through the audited wrapper', async () => {
      const { approveInstructorAction } = await import(
        '@/server/actions/approval-management.actions'
      )
      const adminSession = { user: { id: '1', role: 'ADMIN' } }

      mockRequireAuth.mockResolvedValue(adminSession)
      mockRequireApprovedRole.mockResolvedValue(adminSession)
      mockApprovalService.approveInstructor.mockResolvedValue({
        id: '2',
        status: 'APPROVED',
      })

      const result = await approveInstructorAction('instructor-id')

      expect(mockRequireAuth).toHaveBeenCalled()
      expect(mockRequireApprovedRole).toHaveBeenCalledWith('ADMIN')
      expect(mockWithAuditLogging).toHaveBeenCalledWith(
        expect.objectContaining({
          permission: 'manageUsers',
          action: 'instructor.approve',
          entityType: 'INSTRUCTOR',
          entityId: 'instructor-id',
        })
      )
      expect(mockApprovalService.approveInstructor).toHaveBeenCalledWith('instructor-id')
      expect(result).toEqual({ id: '2', status: 'APPROVED' })
    })

    it('allows SUPER_ADMIN to approve instructor', async () => {
      const { approveInstructorAction } = await import(
        '@/server/actions/approval-management.actions'
      )
      const superAdminSession = { user: { id: '1', role: 'SUPER_ADMIN' } }

      mockRequireAuth.mockResolvedValue(superAdminSession)
      mockRequireApprovedRole.mockResolvedValue(superAdminSession)
      mockApprovalService.approveInstructor.mockResolvedValue({
        id: '2',
        status: 'APPROVED',
      })

      const result = await approveInstructorAction('instructor-id')

      expect(mockRequireAuth).toHaveBeenCalled()
      expect(mockRequireApprovedRole).toHaveBeenCalledWith('SUPER_ADMIN')
      expect(mockApprovalService.approveInstructor).toHaveBeenCalledWith('instructor-id')
      expect(result).toEqual({ id: '2', status: 'APPROVED' })
    })

    it('denies PENDING ADMIN', async () => {
      const { approveInstructorAction } = await import(
        '@/server/actions/approval-management.actions'
      )
      const pendingAdminSession = { user: { id: '1', role: 'ADMIN' } }

      mockRequireAuth.mockResolvedValue(pendingAdminSession)
      mockRequireApprovedRole.mockRejectedValue(
        new ForbiddenError('Admin access is pending approval or suspended.')
      )

      await expect(approveInstructorAction('instructor-id')).rejects.toThrow(ForbiddenError)
      expect(mockWithAuditLogging).not.toHaveBeenCalled()
      expect(mockApprovalService.approveInstructor).not.toHaveBeenCalled()
    })

    it('propagates missing target errors from the service', async () => {
      const { approveInstructorAction } = await import(
        '@/server/actions/approval-management.actions'
      )
      const adminSession = { user: { id: '1', role: 'ADMIN' } }

      mockRequireAuth.mockResolvedValue(adminSession)
      mockRequireApprovedRole.mockResolvedValue(adminSession)
      mockApprovalService.approveInstructor.mockRejectedValue(new Error('Target instructor not found.'))

      await expect(approveInstructorAction('missing-instructor')).rejects.toThrow(
        'Target instructor not found.'
      )
    })
  })

  describe('reject/suspend/reactivate instructor actions - ADMIN/SUPER_ADMIN', () => {
    it.each([
      ['rejectInstructorAction', 'rejectInstructor', 'instructor.reject'],
      ['suspendInstructorAction', 'suspendInstructor', 'instructor.suspend'],
      ['reactivateInstructorAction', 'reactivateInstructor', 'instructor.reactivate'],
    ] as const)('%s runs under manageUsers audit scope', async (actionName, serviceName, auditAction) => {
      const actionModule = await import('@/server/actions/approval-management.actions')
      const action = actionModule[actionName]
      const adminSession = { user: { id: '1', role: 'ADMIN' } }

      mockRequireAuth.mockResolvedValue(adminSession)
      mockRequireApprovedRole.mockResolvedValue(adminSession)
      mockApprovalService[serviceName].mockResolvedValue({ id: '2', status: 'APPROVED' })

      await action('instructor-id')

      expect(mockWithAuditLogging).toHaveBeenCalledWith(
        expect.objectContaining({
          permission: 'manageUsers',
          action: auditAction,
          entityType: 'INSTRUCTOR',
          entityId: 'instructor-id',
        })
      )
      expect(mockApprovalService[serviceName]).toHaveBeenCalledWith('instructor-id')
    })
  })

  describe('Self-approval prevention (service-level)', () => {
    it('service prevents admin from approving themselves', async () => {
      const { approveAdminAction } = await import(
        '@/server/actions/approval-management.actions'
      )
      const superAdminSession = { user: { id: '1', role: 'SUPER_ADMIN' } }

      mockRequireApprovedRole.mockResolvedValue(superAdminSession)
      mockApprovalService.approveAdmin.mockRejectedValue(
        new Error('Admin cannot approve themselves.')
      )

      await expect(approveAdminAction('1')).rejects.toThrow(
        'Admin cannot approve themselves.'
      )
    })

    it('service prevents instructor from approving themselves', async () => {
      const { approveInstructorAction } = await import(
        '@/server/actions/approval-management.actions'
      )
      const adminSession = { user: { id: '1', role: 'ADMIN' } }

      mockRequireAuth.mockResolvedValue(adminSession)
      mockRequireApprovedRole.mockResolvedValue(adminSession)
      mockApprovalService.approveInstructor.mockRejectedValue(
        new Error('Instructor cannot approve themselves.')
      )

      await expect(approveInstructorAction('1')).rejects.toThrow(
        'Instructor cannot approve themselves.'
      )
    })
  })
})
