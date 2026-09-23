import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requirePermission, generate, recordInteraction } = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  generate: vi.fn().mockResolvedValue({ blocks: [], sourceBlockIds: [], action: 'GENERATE_EXPLANATION', generatedAt: new Date().toISOString() }),
  recordInteraction: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/auth', () => ({ requirePermission }))
vi.mock('@/server/services/mastero.service', () => ({ masteroService: { generate, recordInteraction } }))

import { generateMasteroContentAction } from '@/server/actions/mastero.actions'

describe('Mastero action authorization boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each(['ADMIN', 'SUPER_ADMIN', 'CONTENT_EDITOR'])('allows %s through manageResources', async (role) => {
    requirePermission.mockResolvedValue({ user: { id: `${role.toLowerCase()}-1`, role } })
    await generateMasteroContentAction({ materialId: 'material-1', action: 'GENERATE_EXPLANATION' })
    expect(requirePermission).toHaveBeenCalledWith('manageResources')
    expect(generate).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ materialId: 'material-1' }))
  })

  it.each(['STUDENT', 'INSTRUCTOR'])('rejects %s before generation', async (role) => {
    requirePermission.mockRejectedValue(new Error(`${role} denied`))
    await expect(generateMasteroContentAction({ materialId: 'material-1', action: 'GENERATE_EXPLANATION' })).rejects.toThrow(`${role} denied`)
    expect(generate).not.toHaveBeenCalled()
  })
})