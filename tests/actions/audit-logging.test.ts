import { beforeEach, describe, expect, it, vi } from 'vitest'

const requirePermissionMock = vi.hoisted(() => vi.fn())
const recordEventMock = vi.hoisted(() => vi.fn())
const createModuleMock = vi.hoisted(() => vi.fn())

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/auth', () => ({ requirePermission: requirePermissionMock }))
vi.mock('@/server/services/audit-log.service', () => ({ auditLogService: { recordEvent: recordEventMock } }))
vi.mock('@/server/services/module-management.service', () => ({
  ModuleManagementService: vi.fn().mockImplementation(() => ({
    createModule: createModuleMock,
  })),
}))

describe('audit logging for admin actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requirePermissionMock.mockResolvedValue({ user: { id: 'user-1', role: 'SUPER_ADMIN' } })
    createModuleMock.mockResolvedValue({ id: 'module-1', status: 'DRAFT' })
  })

  it('records an audit event for module creation', async () => {
    const { createModuleAction } = await import('../../server/actions/content-management.actions')

    await createModuleAction({ title: 'New Module' } as any)

    expect(requirePermissionMock).toHaveBeenCalledWith('manageModules')
    expect(recordEventMock).toHaveBeenCalledWith(expect.objectContaining({
      actorId: 'user-1',
      actorRole: 'SUPER_ADMIN',
      action: 'module.create',
      entityType: 'MODULE',
      entityId: 'module-1',
      success: true,
    }))
  })
})
