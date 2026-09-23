import { beforeEach, describe, expect, it, vi } from 'vitest'

const requirePermission = vi.fn()
const publish = vi.fn().mockResolvedValue({ id: 'material-1', status: 'PUBLISHED' })

vi.mock('@/auth', () => ({ requirePermission }))
vi.mock('@/server/services/study-material-document.service', () => ({ studyMaterialDocumentService: { publish } }))

describe('study-material editorial authorization', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('requires publishContent before publishing', async () => {
    const { publishStudyMaterialAction } = await import('@/server/actions/study-material-editorial.actions')
    requirePermission.mockRejectedValueOnce(new Error('Forbidden'))
    await expect(publishStudyMaterialAction('material-1')).rejects.toThrow('Forbidden')
    expect(requirePermission).toHaveBeenCalledWith('publishContent')
    expect(publish).not.toHaveBeenCalled()
  })
})
