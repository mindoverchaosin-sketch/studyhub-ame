import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireStudent: vi.fn(),
  getStudentQuestionsByBank: vi.fn(),
  getQuizByTopic: vi.fn(),
  getResourcesByTopic: vi.fn(),
  getTopicProgress: vi.fn(),
  getTopicBySlug: vi.fn(),
  getPublishedModuleAccessContextById: vi.fn(),
  getModuleById: vi.fn(),
  getModuleWithSections: vi.fn(),
  getCourseById: vi.fn(),
  canAccessCourse: vi.fn(),
  canAccessModule: vi.fn(),
}))

vi.mock('@/auth', () => ({ requireStudent: mocks.requireStudent }))
vi.mock('@/server/services/student-question-bank.service', () => ({
  getStudentQuestionsByBank: mocks.getStudentQuestionsByBank,
}))
vi.mock('@/server/services/quiz.service', () => ({ getQuizByTopic: mocks.getQuizByTopic }))
vi.mock('@/server/services/resource.service', () => ({ getResourcesByTopic: mocks.getResourcesByTopic }))
vi.mock('@/server/services/progress.service', () => ({ getTopicProgress: mocks.getTopicProgress }))
vi.mock('@/server/services/topic.service', () => ({ getTopicBySlug: mocks.getTopicBySlug }))
vi.mock('@/server/services/module.service', () => ({
  getPublishedModuleAccessContextById: mocks.getPublishedModuleAccessContextById,
  getModuleById: mocks.getModuleById,
  getModuleWithSections: mocks.getModuleWithSections,
}))
vi.mock('@/server/services/course.service', () => ({ getCourseById: mocks.getCourseById }))
vi.mock('@/server/services/content-access.service', () => ({
  contentAccessService: {
    canAccessCourse: mocks.canAccessCourse,
    canAccessModule: mocks.canAccessModule,
  },
}))

describe('topic learning action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireStudent.mockResolvedValue({ user: { id: 'student-1', role: 'STUDENT' } })
    mocks.getTopicBySlug.mockResolvedValue({
      id: 'topic-1', moduleId: 'module-1', slug: 'topic', title: 'Topic',
      description: null, estimatedMinutes: 10, difficulty: 'BEGINNER',
    })
    mocks.getPublishedModuleAccessContextById.mockResolvedValue({
      courseId: 'course-1', courseIsPremium: false, moduleIsPremium: false,
    })
    mocks.canAccessCourse.mockResolvedValue({ allowed: true })
    mocks.canAccessModule.mockResolvedValue({ allowed: true })
    mocks.getTopicProgress.mockResolvedValue(null)
    mocks.getResourcesByTopic.mockResolvedValue([])
    mocks.getStudentQuestionsByBank.mockResolvedValue([])
    mocks.getQuizByTopic.mockResolvedValue(null)
    mocks.getModuleById.mockResolvedValue({ id: 'module-1', slug: 'module', title: 'Module' })
    mocks.getCourseById.mockResolvedValue({ id: 'course-1', slug: 'course', title: 'Course' })
    mocks.getModuleWithSections.mockResolvedValue({ sections: [{ id: 'topic-1', slug: 'topic', title: 'Topic' }] })
  })

  it('requires student authorization before looking up topic content', async () => {
    mocks.requireStudent.mockRejectedValueOnce(new Error('Forbidden'))
    const { getTopicLearningPageData } = await import('@/features/topics/actions/topic-learning')

    await expect(getTopicLearningPageData('topic')).rejects.toThrow('Forbidden')
    expect(mocks.getTopicBySlug).not.toHaveBeenCalled()
  })

  it('denies access to unpublished parent hierarchies before loading learning data', async () => {
    mocks.getPublishedModuleAccessContextById.mockResolvedValueOnce(null)
    const { getTopicLearningPageData } = await import('@/features/topics/actions/topic-learning')

    await expect(getTopicLearningPageData('topic')).resolves.toBeNull()
    expect(mocks.getTopicProgress).not.toHaveBeenCalled()
    expect(mocks.getStudentQuestionsByBank).not.toHaveBeenCalled()
  })

  it('does not load question data when premium parent access is denied', async () => {
    mocks.canAccessModule.mockResolvedValueOnce({ allowed: false })
    const { getTopicLearningPageData } = await import('@/features/topics/actions/topic-learning')

    await expect(getTopicLearningPageData('topic')).resolves.toBeNull()
    expect(mocks.getStudentQuestionsByBank).not.toHaveBeenCalled()
  })

  it('returns question text without correct answers', async () => {
    mocks.getStudentQuestionsByBank.mockResolvedValueOnce([{
      id: 'question-1',
      questionBankId: 'topic-1',
      question: 'Protected prompt',
      optionA: 'A',
      optionB: 'B',
      optionC: 'C',
      optionD: 'D',
      correctOptionIndex: 2,
      explanation: 'Protected explanation',
    }])
    const { getTopicLearningPageData } = await import('@/features/topics/actions/topic-learning')

    const result = await getTopicLearningPageData('topic')

    expect(result?.questions).toEqual([{
      id: 'question-1', question: 'Protected prompt',
      optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D',
    }])
    expect(JSON.stringify(result?.questions)).not.toContain('correctOptionIndex')
    expect(JSON.stringify(result?.questions)).not.toContain('Protected explanation')
  })
})
