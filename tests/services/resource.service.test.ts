import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockResourceRepository } from '../test-utils/repo-mocks'

describe('resource.service', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('getResourcesByTopic maps resources', async () => {
    const repo = mockResourceRepository({
      findByLesson: vi.fn().mockResolvedValue([
        { id: 'r1', moduleId: 'm1', lessonId: 'l1', title: 'R1', materialType: 'VIDEO', url: 'http://', isPremium: false, status: 'PUBLISHED', publishedAt: null, createdAt: new Date(), updatedAt: new Date() },
      ]),
    })

    const { getResourcesByTopic } = await import('../../server/services/resource.service')
    const res = await getResourcesByTopic('l1')
    expect(res.length).toBe(1)
    expect(repo.findByLesson).toHaveBeenCalledWith('l1')
  })

  it('getResourcesByType forwards type to repository', async () => {
    const repo = mockResourceRepository({
      findByLessonAndType: vi.fn().mockResolvedValue([]),
    })

    const { getResourcesByType } = await import('../../server/services/resource.service')
    const res = await getResourcesByType('l1', 'VIDEO')
    expect(repo.findByLessonAndType).toHaveBeenCalled()
  })
})
