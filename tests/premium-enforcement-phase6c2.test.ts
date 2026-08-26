import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireStudent: vi.fn(),
  redirect: vi.fn((location: string): never => { throw new Error(`REDIRECT:${location}`) }),
  getModuleBySlug: vi.fn(),
  getModuleById: vi.fn(),
  canAccessLesson: vi.fn(),
  canAccessQuiz: vi.fn(),
  canAccessStudyMaterial: vi.fn(),
  getQuizWithQuestions: vi.fn(),
  getTopicById: vi.fn(),
  getTopicBySlug: vi.fn(),
  getTopicProgress: vi.fn(),
  getQuizAnalytics: vi.fn(),
  submitQuizAttempt: vi.fn(),
  questionBankFindById: vi.fn(),
  questionFindById: vi.fn(),
  canAccessQuestionBank: vi.fn(),
  canAccessQuestion: vi.fn(),
  templateGetTemplate: vi.fn(),
  generateExamAttempt: vi.fn(),
  canAccessExamTemplate: vi.fn(),
  requireOwnership: vi.fn(),
  getTopicLearningPageData: vi.fn(),
}))

vi.mock('@/auth', () => ({
  auth: vi.fn(async () => ({ user: { id: 'student-1', role: 'STUDENT' } })),
  requireStudent: mocks.requireStudent,
  requireOwnership: mocks.requireOwnership,
}))
vi.mock('next/navigation', () => ({ redirect: mocks.redirect, notFound: vi.fn() }))
vi.mock('@/server/services/module.service', () => ({ getModuleBySlug: mocks.getModuleBySlug, getModuleById: mocks.getModuleById }))
vi.mock('@/server/services/content-access.service', () => ({
  contentAccessService: {
    canAccessLesson: mocks.canAccessLesson,
    canAccessQuiz: mocks.canAccessQuiz,
    canAccessStudyMaterial: mocks.canAccessStudyMaterial,
    canAccessQuestionBank: mocks.canAccessQuestionBank,
    canAccessQuestion: mocks.canAccessQuestion,
    canAccessExamTemplate: mocks.canAccessExamTemplate,
  },
}))
vi.mock('@/server/services/quiz.service', () => ({
  getQuizWithQuestions: mocks.getQuizWithQuestions,
  getQuizAnalytics: mocks.getQuizAnalytics,
  submitQuizAttempt: mocks.submitQuizAttempt,
}))
vi.mock('@/server/services/topic.service', () => ({ getTopicById: mocks.getTopicById, getTopicBySlug: mocks.getTopicBySlug }))
vi.mock('@/server/services/progress.service', () => ({ getTopicProgress: mocks.getTopicProgress }))
vi.mock('@/server/repositories/question-bank.repository', () => ({ questionBankRepository: { findById: mocks.questionBankFindById } }))
vi.mock('@/server/repositories/question.repository', () => ({ questionRepository: { findById: mocks.questionFindById } }))
vi.mock('@/server/services/exam-template.service', () => ({ getTemplate: mocks.templateGetTemplate }))
vi.mock('@/server/services/exam-attempt.service', () => ({ generateExamAttempt: mocks.generateExamAttempt }))
vi.mock('@/features/topics/actions/topic-learning', () => ({ getTopicLearningPageData: mocks.getTopicLearningPageData }))

describe('Phase 6C.2 premium enforcement execution paths', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireStudent.mockResolvedValue({ user: { id: 'student-1', role: 'STUDENT' } })
    mocks.canAccessLesson.mockResolvedValue({ allowed: true })
    mocks.canAccessQuiz.mockResolvedValue({ allowed: true })
    mocks.canAccessStudyMaterial.mockResolvedValue({ allowed: true })
    mocks.canAccessQuestionBank.mockResolvedValue({ allowed: true })
    mocks.canAccessQuestion.mockResolvedValue({ allowed: true })
    mocks.canAccessExamTemplate.mockResolvedValue({ allowed: true })
    mocks.getModuleBySlug.mockResolvedValue({ id: 'module-1', isPremium: true })
    mocks.getModuleById.mockResolvedValue({ id: 'module-1', isPremium: true })
    mocks.getTopicBySlug.mockResolvedValue({ id: 'topic-1', moduleId: 'module-1', slug: 'structural-layout', title: 'Structural layout' })
    mocks.getTopicLearningPageData.mockResolvedValue({ topic: { title: 'Structural layout', description: 'Persisted lesson' }, resources: [], questions: [], quiz: null, progress: { status: 'NOT_STARTED' }, navigation: {} })
  })

  it('denies and allows premium lessons through the page access path', async () => {
    const { default: lessonPage } = await import('@/app/(student)/student/modules/[slug]/lessons/[lessonSlug]/page')
    mocks.canAccessLesson.mockResolvedValueOnce({ allowed: false, requiredFeature: 'premiumModules' })

    await expect(lessonPage({ params: Promise.resolve({ slug: 'airframes-and-systems', lessonSlug: 'structural-layout' }) })).rejects.toThrow('REDIRECT:')
    expect(mocks.canAccessLesson).toHaveBeenCalledWith('student-1', true)

    mocks.canAccessLesson.mockResolvedValueOnce({ allowed: true })
    await expect(lessonPage({ params: Promise.resolve({ slug: 'airframes-and-systems', lessonSlug: 'structural-layout' }) })).resolves.toBeTruthy()
  })

  it('denies and allows premium quizzes through load and submit actions', async () => {
    mocks.getQuizWithQuestions.mockResolvedValue({ id: 'quiz-1', moduleId: 'module-1', topicId: 'topic-1', questionBanks: [], questions: [] })
    mocks.getTopicById.mockResolvedValue({ title: 'Topic' })
    mocks.getTopicProgress.mockResolvedValue(null)
    mocks.getQuizAnalytics.mockResolvedValue({ bestScore: 0, averageScore: 0, completionPercent: 0, recentAttempts: [] })
    mocks.submitQuizAttempt.mockResolvedValue({ score: 100 })
    const { getQuizPlayerPageData, submitQuizAction } = await import('@/features/quiz/actions/quiz-player')

    mocks.canAccessQuiz.mockResolvedValueOnce({ allowed: false, requiredFeature: 'premiumModules' })
    await expect(getQuizPlayerPageData('quiz-1')).rejects.toThrow('REDIRECT:')
    expect(mocks.canAccessQuiz).toHaveBeenCalledWith('student-1', true)

    mocks.canAccessQuiz.mockResolvedValueOnce({ allowed: true })
    await expect(getQuizPlayerPageData('quiz-1')).resolves.toBeTruthy()
    mocks.canAccessQuiz.mockResolvedValueOnce({ allowed: true })
    await expect(submitQuizAction('quiz-1', {}, Date.now())).resolves.toEqual({ score: 100 })
  })

  it('loads question-bank and question premium state from the database', async () => {
    const { canAccessQuestionBankAction, canAccessQuestionAction } = await import('@/server/actions/student-content-access.actions')
    mocks.questionBankFindById.mockResolvedValue({ id: 'qb-1', isPremium: true })
    mocks.questionFindById.mockResolvedValue({ id: 'question-1', questionBankId: 'qb-1' })

    await expect(canAccessQuestionBankAction('qb-1', false)).resolves.toEqual({ allowed: true })
    expect(mocks.canAccessQuestionBank).toHaveBeenCalledWith('student-1', true)

    mocks.canAccessQuestion.mockResolvedValueOnce({ allowed: false, requiredFeature: 'premiumModules' })
    await expect(canAccessQuestionAction('qb-1', 'question-1', false)).resolves.toMatchObject({ allowed: false })
    expect(mocks.canAccessQuestion).toHaveBeenCalledWith('student-1', true)
  })

  it('keeps premium mock-test denial before attempt creation', async () => {
    mocks.templateGetTemplate.mockResolvedValue({ id: 'template-1', isPremium: true, moduleId: undefined })
    mocks.canAccessExamTemplate.mockResolvedValue({ allowed: false, requiredFeature: 'unlimitedMockExams' })
    const { generateAttempt } = await import('@/server/actions/exam.actions')

    await expect(generateAttempt('template-1', 'student-1')).rejects.toThrow('Premium exam template access required')
    expect(mocks.generateExamAttempt).not.toHaveBeenCalled()
  })

  it('preserves student ownership restrictions before mock-test access', async () => {
    mocks.requireOwnership.mockImplementation(() => { throw new Error('Access denied.') })
    mocks.templateGetTemplate.mockResolvedValue({ id: 'template-1', isPremium: false })
    const { generateAttempt } = await import('@/server/actions/exam.actions')

    await expect(generateAttempt('template-1', 'student-2')).rejects.toThrow('Access denied.')
    expect(mocks.templateGetTemplate).not.toHaveBeenCalled()
  })
})