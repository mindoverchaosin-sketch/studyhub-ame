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
import { ForbiddenError, UnauthorizedError, requirePermission, requireRole } from '../../lib/auth'

describe('PermissionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('grants enterprise roles based on their role mapping', () => {
    const service = new PermissionService()

    expect(service.hasPermission('SUPER_ADMIN', 'manageUsers')).toBe(true)
    expect(service.hasPermission('CONTENT_MANAGER', 'manageModules')).toBe(true)
    expect(service.hasPermission('STUDENT_MANAGER', 'manageStudents')).toBe(true)
    expect(service.hasPermission('FINANCE_MANAGER', 'manageBilling')).toBe(true)
    expect(service.hasPermission('SUPPORT_AGENT', 'manageUsers')).toBe(true)
    expect(service.hasPermission('QUESTION_REVIEWER', 'manageQuestions')).toBe(true)
    expect(service.hasPermission('SUPPORT_AGENT', 'manageBilling')).toBe(false)
  })

  it('treats legacy admin roles as super users', () => {
    const service = new PermissionService()

    expect(service.hasPermission('ADMIN', 'manageUsers')).toBe(true)
    expect(service.hasPermission('ADMIN', 'manageQuestions')).toBe(true)
  })

  it('supports role-based checks', () => {
    const service = new PermissionService()

    expect(service.hasRole('SUPER_ADMIN', 'SUPER_ADMIN')).toBe(true)
    expect(service.hasRole('CONTENT_MANAGER', 'SUPER_ADMIN')).toBe(false)
  })

  it('rejects users that lack permissions', async () => {
    getServerSessionMock.mockResolvedValue({ user: { id: 'user-1', role: 'STUDENT' } })
    findByIdMock.mockResolvedValue({ id: 'user-1', isActive: true, role: { name: 'STUDENT' } })
    getPermissionsForUserMock.mockResolvedValue({ role: { permissions: [] } })

    await expect(requirePermission('manageStudents')).rejects.toThrow(ForbiddenError)
  })

  it('rejects unauthenticated requests for role checks', async () => {
    getServerSessionMock.mockResolvedValue(null)

    await expect(requireRole('SUPER_ADMIN')).rejects.toThrow(UnauthorizedError)
  })
})
