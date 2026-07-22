import { vi } from 'vitest'

export function mockQuizRepository(stubs: Partial<any> = {}) {
  const defaultImpl = {
    findAllPublished: vi.fn().mockResolvedValue([]),
    findWithQuestions: vi.fn().mockResolvedValue(null),
    findById: vi.fn().mockResolvedValue(null),
    findByLesson: vi.fn().mockResolvedValue(null),
    countAll: vi.fn().mockResolvedValue(0),
  }

  const impl = { ...defaultImpl, ...stubs }

  vi.doMock('@/server/repositories/quiz.repository', () => ({
    quizRepository: impl,
  }))

  return impl
}

export function mockResourceRepository(stubs: Partial<any> = {}) {
  const defaultImpl = {
    findByLesson: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    findByLessonAndType: vi.fn().mockResolvedValue([]),
    countAll: vi.fn().mockResolvedValue(0),
  }

  const impl = { ...defaultImpl, ...stubs }

  vi.doMock('@/server/repositories/resource.repository', () => ({
    resourceRepository: impl,
  }))

  return impl
}
