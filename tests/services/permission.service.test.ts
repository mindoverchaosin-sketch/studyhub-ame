import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getServerSessionMock, findByIdMock, getPermissionsForUserMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  findByIdMock: vi.fn(),
  getPermissionsForUserMock: vi.fn(),
}))

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
  default: {},
}))

vi.mock('next-auth/providers/credentials', () => ({
  default: vi.fn(() => ({})),
}))

vi.mock('@/server/repositories/user.repository', () => ({
  userRepository: {
    findById: findByIdMock,
  },
}))

vi.mock('@/server/repositories/role.repository', () => ({
  roleRepository: {
    getPermissionsForUser: getPermissionsForUserMock,
  },
}))

vi.mock('@/server/services/user.service', () => ({
  getUserByEmail: vi.fn(),
}))

import { PermissionService } from '../../server/services/permission.service'
import { getPermissionMatrix } from '../../server/services/authorization.service'
import { ForbiddenError, UnauthorizedError, requireApprovedRole, requirePermission, requireRole } from '../../lib/auth'

describe('PermissionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('accepts only the canonical five-role model', () => {
    const service = new PermissionService()

    expect(service.hasPermission('STUDENT', 'viewStudentContent')).toBe(true)
    expect(service.hasPermission('INSTRUCTOR', 'viewOwnAnalytics')).toBe(true)
    expect(service.hasPermission('CONTENT_EDITOR', 'publishContent')).toBe(true)
    expect(service.hasPermission('ADMIN', 'manageUsers')).toBe(true)
    expect(service.hasPermission('SUPER_ADMIN', 'manageUsers')).toBe(true)

    expect(service.hasPermission('CONTENT_MANAGER', 'manageModules')).toBe(false)
    expect(service.hasPermission('STUDENT_MANAGER', 'manageStudents')).toBe(false)
    expect(service.hasPermission('FINANCE_MANAGER', 'manageBilling')).toBe(false)
    expect(service.hasPermission('SUPPORT_AGENT', 'manageUsers')).toBe(false)
    expect(service.hasPermission('QUESTION_REVIEWER', 'manageQuestions')).toBe(false)
  })

  it('matches the canonical permission matrix parity', () => {
    const service = new PermissionService()
    const matrix = getPermissionMatrix()

    for (const role of Object.keys(matrix) as Array<keyof typeof matrix>) {
      for (const permission of matrix[role]) {
        expect(service.hasPermission(role, permission)).toBe(true)
      }
    }
  })

  it('grants all actively used app permissions to the correct roles', () => {
    const service = new PermissionService()

    expect(service.hasPermission('ADMIN', 'manageUsers')).toBe(true)
    expect(service.hasPermission('ADMIN', 'manageStudents')).toBe(true)
    expect(service.hasPermission('ADMIN', 'manageModules')).toBe(true)
    expect(service.hasPermission('ADMIN', 'manageResources')).toBe(true)
    expect(service.hasPermission('ADMIN', 'manageQuestions')).toBe(true)
    expect(service.hasPermission('ADMIN', 'publishContent')).toBe(true)
    expect(service.hasPermission('ADMIN', 'viewAnalytics')).toBe(true)
    expect(service.hasPermission('ADMIN', 'manageBilling')).toBe(true)
    expect(service.hasPermission('ADMIN', 'viewBillingAnalytics')).toBe(true)
    expect(service.hasPermission('ADMIN', 'manageInvoices')).toBe(true)
    expect(service.hasPermission('ADMIN', 'manageAuditLogs')).toBe(true)

    expect(service.hasPermission('CONTENT_EDITOR', 'manageModules')).toBe(true)
    expect(service.hasPermission('CONTENT_EDITOR', 'publishContent')).toBe(true)
    expect(service.hasPermission('CONTENT_EDITOR', 'manageQuestions')).toBe(true)

    expect(service.hasPermission('STUDENT', 'viewStudentContent')).toBe(true)
    expect(service.hasPermission('STUDENT', 'accessAiTutor')).toBe(true)
  })

  it('supports role-based checks', () => {
    const service = new PermissionService()

    expect(service.hasRole('SUPER_ADMIN', 'SUPER_ADMIN')).toBe(true)
    expect(service.hasRole('ADMIN', 'SUPER_ADMIN')).toBe(false)
    expect(service.hasRole('CONTENT_EDITOR', 'CONTENT_EDITOR')).toBe(true)
  })

  it('rejects users that lack permissions', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1', role: 'STUDENT' } })
    findByIdMock.mockResolvedValue({ id: 'user-1', isActive: true, role: { name: 'STUDENT' } })
    getPermissionsForUserMock.mockResolvedValue({ role: { permissions: [] } })

    await expect(requirePermission('manageStudents')).rejects.toThrow(ForbiddenError)
  })

  it('rejects unsupported legacy roles even if the DB fallback would grant them', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'legacy-user', role: 'CONTENT_MANAGER' } })
    findByIdMock.mockResolvedValue({ id: 'legacy-user', isActive: true, role: { name: 'CONTENT_MANAGER' } })
    getPermissionsForUserMock.mockResolvedValue({
      role: {
        permissions: [{ permission: { name: 'manageModules' } }],
      },
    })

    await expect(requirePermission('manageModules')).rejects.toThrow(UnauthorizedError)
  })

  it('rejects unauthenticated requests for role checks', async () => {
    getServerSessionMock.mockResolvedValue(null)

    await expect(requireRole('SUPER_ADMIN')).rejects.toThrow(UnauthorizedError)
  })

  it('allows SUPER_ADMIN and ADMIN through the privileged admin approval path', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'admin-user', role: 'ADMIN' } })
    findByIdMock.mockResolvedValue({ id: 'admin-user', isActive: true, role: { name: 'ADMIN' }, adminProfile: { status: 'APPROVED' } })

    await expect(requireApprovedRole('ADMIN')).resolves.toMatchObject({ user: { role: 'ADMIN' } })

    getServerSessionMock.mockResolvedValue({ user: { id: 'super-user', role: 'SUPER_ADMIN' } })
    findByIdMock.mockResolvedValue({ id: 'super-user', isActive: true, role: { name: 'SUPER_ADMIN' } })

    await expect(requireApprovedRole('ADMIN')).resolves.toMatchObject({ user: { role: 'SUPER_ADMIN' } })
  })

  it('rejects STUDENT from the privileged admin approval path', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'student-user', role: 'STUDENT' } })
    findByIdMock.mockResolvedValue({ id: 'student-user', isActive: true, role: { name: 'STUDENT' } })

    await expect(requireApprovedRole('ADMIN')).rejects.toThrow('ADMIN access required.')
  })
})
