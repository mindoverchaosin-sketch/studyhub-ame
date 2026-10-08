import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  quizDelete: vi.fn(),
}))

vi.mock('@/server/repositories/lesson.repository', () => ({ lessonRepository: {} }))
vi.mock('@/server/repositories/question.repository', () => ({ questionRepository: {} }))
vi.mock('@/server/repositories/quiz.repository', () => ({
  quizRepository: { delete: mocks.quizDelete },
}))
vi.mock('@/services/media/local-media-provider', () => ({ LocalMediaProvider: class {} }))
vi.mock('@/server/services/media/media-library.service', () => ({
  MediaLibraryService: class {},
}))

describe('CMS bulk Quiz deletion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    ['with attempts', 3],
    ['without attempts', 0],
  ])('refuses Quiz deletion %s', async () => {
    const { CmsBulkService } = await import('@/server/services/cms-bulk.service')
    const service = new CmsBulkService()

    const result = await service.applyBulkAction('mock-tests', ['quiz-1'], 'delete')

    expect(result).toEqual({
      successCount: 0,
      failureCount: 1,
      errors: ['Unable to process quiz-1: Quiz deletion is not permitted through bulk operations. Archive the quiz to preserve attempt history.'],
    })
    expect(mocks.quizDelete).not.toHaveBeenCalled()
  })
})
