import { beforeEach, describe, expect, it, vi } from 'vitest'

const requirePermissionMock = vi.fn()
const service = {
  create: vi.fn().mockResolvedValue({ id: 'paper-1' }),
  update: vi.fn().mockResolvedValue({ id: 'paper-1' }),
  archive: vi.fn().mockResolvedValue({ id: 'paper-1' }),
  publish: vi.fn().mockResolvedValue({ id: 'paper-1' }),
  unpublish: vi.fn().mockResolvedValue({ id: 'paper-1' }),
}

vi.mock('@/auth', () => ({ requirePermission: requirePermissionMock }))
vi.mock('@/server/services/previous-official-paper.service', () => ({ previousOfficialPaperService: service }))
vi.mock('@/server/actions/audit-helpers', () => ({ withAuditLogging: vi.fn(({ run }) => run()) }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

describe('previous official paper authorization', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    requirePermissionMock.mockResolvedValue({ user: { id: 'editor-1', role: 'CONTENT_EDITOR' } })
  })

  it('uses manageResources for create, update, and archive', async () => {
    const actions = await import('@/server/actions/previous-official-paper.actions')
    await actions.createPreviousOfficialPaperAction({ courseId: 'c', moduleId: 'm', year: 2025, title: 'Paper', paperType: 'Official PDF', mediaPath: '/media/paper.pdf' })
    await actions.updatePreviousOfficialPaperAction('paper-1', { title: 'Updated' })
    await actions.archivePreviousOfficialPaperAction('paper-1')
    expect(requirePermissionMock).toHaveBeenNthCalledWith(1, 'manageResources')
    expect(requirePermissionMock).toHaveBeenNthCalledWith(2, 'manageResources')
    expect(requirePermissionMock).toHaveBeenNthCalledWith(3, 'manageResources')
  })

  it('uses publishContent for publish and unpublish', async () => {
    const actions = await import('@/server/actions/previous-official-paper.actions')
    await actions.publishPreviousOfficialPaperAction('paper-1')
    await actions.unpublishPreviousOfficialPaperAction('paper-1')
    expect(requirePermissionMock).toHaveBeenNthCalledWith(1, 'publishContent')
    expect(requirePermissionMock).toHaveBeenNthCalledWith(2, 'publishContent')
  })

  it('rejects unauthorized paper management before service execution', async () => {
    requirePermissionMock.mockRejectedValue(new Error('Access denied'))
    const actions = await import('@/server/actions/previous-official-paper.actions')
    await expect(actions.createPreviousOfficialPaperAction({ courseId: 'c', moduleId: 'm', year: 2025, title: 'Paper', paperType: 'Official PDF', mediaPath: '/media/paper.pdf' })).rejects.toThrow('Access denied')
    expect(service.create).not.toHaveBeenCalled()
  })
})
