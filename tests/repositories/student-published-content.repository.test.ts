import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  courseFindMany: vi.fn(),
  moduleFindMany: vi.fn(),
  moduleFindFirst: vi.fn(),
  topicFindMany: vi.fn(),
  topicFindFirst: vi.fn(),
  quizFindFirst: vi.fn(),
  questionFindMany: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  default: {
    course: { findMany: mocks.courseFindMany },
    module: { findMany: mocks.moduleFindMany, findFirst: mocks.moduleFindFirst },
    lesson: { findMany: mocks.topicFindMany, findFirst: mocks.topicFindFirst },
    quiz: { findFirst: mocks.quizFindFirst },
    question: { findMany: mocks.questionFindMany },
  },
}))

describe('student published-content repository boundaries', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('limits course selectors to published, non-deleted courses', async () => {
    const { courseRepository } = await import('@/server/repositories/course.repository')
    await courseRepository.findAllPublished()

    expect(mocks.courseFindMany).toHaveBeenCalledWith({
      where: { status: 'PUBLISHED', deletedAt: null },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('limits module catalog queries to published, non-deleted modules', async () => {
    const { moduleRepository } = await import('@/server/repositories/module.repository')
    await moduleRepository.findByCourse('course-1')

    expect(mocks.moduleFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { courseId: 'course-1', status: 'PUBLISHED', deletedAt: null },
    }))
  })

  it('limits module details and lesson lists to published content', async () => {
    const { moduleRepository } = await import('@/server/repositories/module.repository')
    await moduleRepository.findWithSections('module-1')

    expect(mocks.moduleFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'module-1', status: 'PUBLISHED', deletedAt: null },
      include: { lessons: { where: { status: 'PUBLISHED', deletedAt: null }, orderBy: { displayOrder: 'asc' } } },
    }))
  })

  it('limits the publishing lesson inventory to non-deleted lessons', async () => {
    const { lessonRepository } = await import('@/server/repositories/lesson.repository')
    await lessonRepository.findAll()

    expect(mocks.topicFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { deletedAt: null },
    }))
  })

  it('limits topic lookups to published lessons', async () => {
    const { topicRepository } = await import('@/server/repositories/topic.repository')
    await topicRepository.findBySlug('lesson-slug')

    expect(mocks.topicFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { slug: 'lesson-slug', status: 'PUBLISHED', deletedAt: null },
    }))
  })

  it('loads only published quizzes, banks, and questions for students', async () => {
    const { quizRepository } = await import('@/server/repositories/quiz.repository')
    await quizRepository.findPublishedWithQuestions('quiz-1')

    expect(mocks.quizFindFirst).toHaveBeenCalledWith({
      where: { id: 'quiz-1', status: 'PUBLISHED', deletedAt: null },
      include: {
        questionBanks: {
          where: { status: 'PUBLISHED', deletedAt: null },
          include: { questions: { where: { status: 'PUBLISHED', deletedAt: null } } },
        },
      },
    })
  })

  it('limits exam question-bank selection to published questions', async () => {
    const { questionRepository } = await import('@/server/repositories/question.repository')
    await questionRepository.findPublishedByBank('bank-1')

    expect(mocks.questionFindMany).toHaveBeenCalledWith({ where: { questionBankId: 'bank-1', status: 'PUBLISHED', deletedAt: null } })
  })
})
