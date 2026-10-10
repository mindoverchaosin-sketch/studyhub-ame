import { beforeEach, describe, expect, it, vi } from 'vitest'

const requirePermission = vi.fn()
const publish = vi.fn().mockResolvedValue({ id: 'material-1', status: 'PUBLISHED' })
const reject = vi.fn().mockResolvedValue({ id: 'material-1', status: 'DRAFT' })

vi.mock('@/auth', () => ({ requirePermission }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/server/services/study-material-document.service', () => ({ studyMaterialDocumentService: { publish, reject } }))

describe('study-material editorial authorization', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('requires publishContent before publishing', async () => {
    const { publishStudyMaterialAction } = await import('@/server/actions/study-material-editorial.actions')
    requirePermission.mockRejectedValueOnce(new Error('Forbidden'))
    await expect(publishStudyMaterialAction('material-1')).rejects.toThrow('Forbidden')
    expect(requirePermission).toHaveBeenCalledWith('publishContent')
    expect(publish).not.toHaveBeenCalled()
  })

  it('does not invoke rejection when publishContent is denied', async () => {
    const { rejectStudyMaterialAction } = await import('@/server/actions/study-material-editorial.actions')
    requirePermission.mockRejectedValueOnce(new Error('Forbidden'))

    await expect(rejectStudyMaterialAction('material-1', 'module-1', 'Needs revision')).rejects.toThrow('Forbidden')

    expect(requirePermission).toHaveBeenCalledWith('publishContent')
    expect(reject).not.toHaveBeenCalled()
  })

  it('passes the resource ID and reason to the rejection service when authorized', async () => {
    const { rejectStudyMaterialAction } = await import('@/server/actions/study-material-editorial.actions')

    await expect(rejectStudyMaterialAction('material-1', 'module-1', 'Needs revision')).resolves.toEqual({
      id: 'material-1',
      status: 'DRAFT',
    })

    expect(requirePermission).toHaveBeenCalledWith('publishContent')
    expect(reject).toHaveBeenCalledWith('material-1', 'Needs revision')
  })
})
