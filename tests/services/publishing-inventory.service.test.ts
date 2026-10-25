import { beforeEach, describe, expect, it, vi } from 'vitest'

const repositories = vi.hoisted(() => ({
  moduleRepository: { findAll: vi.fn() },
  lessonRepository: { findAll: vi.fn() },
  resourceRepository: { findAll: vi.fn() },
  questionRepository: { findAll: vi.fn() },
  editorialWorkflowRepository: { findByTargets: vi.fn() },
}))

vi.mock('@/server/repositories/module.repository', () => ({ moduleRepository: repositories.moduleRepository }))
vi.mock('@/server/repositories/lesson.repository', () => ({ lessonRepository: repositories.lessonRepository }))
vi.mock('@/server/repositories/resource.repository', () => ({ resourceRepository: repositories.resourceRepository }))
vi.mock('@/server/repositories/question.repository', () => ({ questionRepository: repositories.questionRepository }))
vi.mock('@/server/repositories/editorial-workflow.repository', () => ({ editorialWorkflowRepository: repositories.editorialWorkflowRepository }))

import { getPublishingInventory } from '@/server/services/publishing-inventory.service'

const updatedAt = new Date('2026-01-01T00:00:00.000Z')

describe('publishing inventory service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    repositories.moduleRepository.findAll.mockResolvedValue([
      { id: 'module-1', title: 'Module one', status: 'DRAFT', updatedAt, deletedAt: null },
      { id: 'module-deleted', title: 'Deleted module', status: 'DRAFT', updatedAt, deletedAt: updatedAt },
    ])
    repositories.lessonRepository.findAll.mockResolvedValue([
      { id: 'lesson-1', title: 'Lesson one', status: 'IN_REVIEW', updatedAt, deletedAt: null, moduleId: 'module-1' },
    ])
    repositories.resourceRepository.findAll.mockResolvedValue([
      { id: 'material-1', title: 'Approved material', status: 'IN_REVIEW', updatedAt, deletedAt: null, moduleId: 'module-1' },
      { id: 'material-deleted', title: 'Deleted material', status: 'DRAFT', updatedAt, deletedAt: updatedAt, moduleId: null },
    ])
    repositories.questionRepository.findAll.mockResolvedValue([
      { id: 'question-1', prompt: 'Question prompt', status: 'PUBLISHED', updatedAt, deletedAt: null },
    ])
    repositories.editorialWorkflowRepository.findByTargets.mockResolvedValue([
      { entityId: 'material-1', status: 'APPROVED' },
    ])
  })

  it('lists supported active content and reports study-material editorial status', async () => {
    const inventory = await getPublishingInventory()

    expect(inventory).toHaveLength(4)
    expect(inventory).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'module-1', targetType: 'MODULE', status: 'DRAFT' }),
      expect.objectContaining({ id: 'lesson-1', targetType: 'LESSON', status: 'IN_REVIEW', moduleId: 'module-1' }),
      expect.objectContaining({ id: 'material-1', targetType: 'STUDY_MATERIAL', status: 'APPROVED' }),
      expect.objectContaining({ id: 'question-1', targetType: 'QUESTION', title: 'Question prompt', status: 'PUBLISHED' }),
    ]))
    expect(repositories.editorialWorkflowRepository.findByTargets).toHaveBeenCalledWith('STUDY_MATERIAL', ['material-1'])
  })
})
