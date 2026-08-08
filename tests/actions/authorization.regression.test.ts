import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireStudentMock = vi.fn()
const requirePermissionMock = vi.fn()
const requireAdminMock = vi.fn()
const requireOwnershipMock = vi.fn((resourceUserId: string, currentUserId: string, allowAdmin = false, currentUserRole?: string) => {
  if (allowAdmin && currentUserRole === 'ADMIN') {
    return
  }

  if (resourceUserId !== currentUserId) {
    throw new ForbiddenError('Access denied.')
  }
})

class ForbiddenError extends Error {
  constructor(message = 'Access denied.') {
    super(message)
    this.name = 'ForbiddenError'
    ;(this as any).status = 403
  }
}

class UnauthorizedError extends Error {
  constructor(message = 'Authentication required.') {
    super(message)
    this.name = 'UnauthorizedError'
    ;(this as any).status = 401
  }
}

class NotFoundError extends Error {
  constructor(message = 'Resource not found.') {
    super(message)
    this.name = 'NotFoundError'
    ;(this as any).status = 404
  }
}

vi.mock('@/auth', () => ({
  requireStudent: requireStudentMock,
  requireAdmin: requireAdminMock,
  requirePermission: requirePermissionMock,
  requireOwnership: requireOwnershipMock,
  ForbiddenError,
  UnauthorizedError,
  NotFoundError,
}))

const getDashboardSummaryMock = vi.fn()
const loadAttemptMock = vi.fn()
const loadAttemptByQuestionMock = vi.fn()
const generateExamAttemptMock = vi.fn()
const saveAnswerMock = vi.fn()
const bookmarkQuestionMock = vi.fn()
const markForReviewMock = vi.fn()
const submitAttemptMock = vi.fn()
const listExamHistoryMock = vi.fn()
const createTemplateMock = vi.fn()
const activateTemplateMock = vi.fn()
const bulkUpdateQuestionStatusMock = vi.fn()
const getGoalProgressMock = vi.fn()
const updateGoalsMock = vi.fn()
const getAchievementsMock = vi.fn()
const getProgressInsightsMock = vi.fn()
const getContinueLearningMock = vi.fn()
const generateDailyPlanMock = vi.fn()
const processCompletedAttemptMock = vi.fn()

const editorialWorkflowServiceMocks = {
  addLessonReviewComment: vi.fn(),
  addReviewComment: vi.fn(),
  approveLessonReview: vi.fn(),
  archiveQuestion: vi.fn(),
  assignLessonReviewer: vi.fn(),
  assignReviewer: vi.fn(),
  bulkAssignReviewerToQuestions: vi.fn(),
  bulkApproveWorkflowQuestions: vi.fn(),
  bulkUpdateLessonReviewQueue: vi.fn(),
  bulkUpdateReviewQueue: vi.fn(),
  compareVersions: vi.fn(),
  createLessonVersionSnapshot: vi.fn(),
  createVersionSnapshot: vi.fn(),
  EditorialStatus: {},
  getEditorialWorkflow: vi.fn(),
  getLessonEditorialWorkflow: vi.fn(),
  publishLesson: vi.fn(),
  publishQuestion: vi.fn(),
  rejectLessonReview: vi.fn(),
  restoreArchivedQuestion: vi.fn(),
  restoreLessonVersion: vi.fn(),
  restoreVersion: vi.fn(),
  sendLessonBackToDraft: vi.fn(),
  submitLessonForReview: vi.fn(),
  unpublishLesson: vi.fn(),
  unpublishQuestion: vi.fn(),
  updateEditorialStatus: vi.fn(),
  updateLessonEditorialStatus: vi.fn(),
}

vi.mock('@/server/services/dashboard.service', () => ({
  getDashboardSummary: getDashboardSummaryMock,
}))
vi.mock('@/server/services/exam-attempt.service', () => ({
  loadAttempt: loadAttemptMock,
  loadAttemptByQuestion: loadAttemptByQuestionMock,
  generateExamAttempt: generateExamAttemptMock,
  saveAnswer: saveAnswerMock,
  bookmarkQuestion: bookmarkQuestionMock,
  markForReview: markForReviewMock,
  submitAttempt: submitAttemptMock,
  listExamHistory: listExamHistoryMock,
}))
vi.mock('@/server/services/exam-completion.service', () => ({
  processCompletedAttempt: processCompletedAttemptMock,
}))
vi.mock('@/server/services/exam-template.service', () => ({
  createTemplate: createTemplateMock,
  activateTemplate: activateTemplateMock,
}))
vi.mock('@/server/services/question.service', () => ({
  bulkUpdateQuestionStatus: bulkUpdateQuestionStatusMock,
}))
vi.mock('@/server/services/editorial-workflow.service', () => editorialWorkflowServiceMocks)
vi.mock('@/server/services/goal-tracking.service', () => ({
  getGoalProgress: getGoalProgressMock,
  updateGoals: updateGoalsMock,
}))
vi.mock('@/server/services/achievement.service', () => ({
  getAchievements: getAchievementsMock,
}))
vi.mock('@/server/services/progress-insights.service', () => ({
  getProgressInsights: getProgressInsightsMock,
}))
vi.mock('@/server/services/continue-learning.service', () => ({
  getContinueLearning: getContinueLearningMock,
}))
vi.mock('@/server/services/study-planner.service', () => ({
  generateDailyPlan: generateDailyPlanMock,
}))

describe.sequential('authorization regression tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should forbid dashboard access to a different student', async () => {
    requireStudentMock.mockResolvedValue({ user: { id: 'student-2' } })
    const { getDashboardSummaryAction } = await import('../../server/actions/dashboard.actions')

    await expect(getDashboardSummaryAction('student-1')).rejects.toThrow(ForbiddenError)
    expect(getDashboardSummaryMock).not.toHaveBeenCalled()
  })

  it('should return unauthorized for dashboard access without a valid session', async () => {
    requireStudentMock.mockRejectedValue(new UnauthorizedError())
    const { getDashboardSummaryAction } = await import('../../server/actions/dashboard.actions')

    await expect(getDashboardSummaryAction('student-1')).rejects.toThrow(UnauthorizedError)
    expect(getDashboardSummaryMock).not.toHaveBeenCalled()
  })

  it('should forbid non-admin student from generating another student exam attempt', async () => {
    requireStudentMock.mockResolvedValue({ user: { id: 'student-1', role: 'STUDENT' } })
    const { generateAttempt } = await import('../../server/actions/exam.actions')

    await expect(generateAttempt('template-1', 'student-2')).rejects.toThrow(ForbiddenError)
    expect(loadAttemptMock).not.toHaveBeenCalled()
  })

  it('should allow admin to generate an exam attempt for any student', async () => {
    requireStudentMock.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } })
    generateExamAttemptMock.mockResolvedValue({ id: 'generated-attempt' })
    const { generateAttempt } = await import('../../server/actions/exam.actions')

    await expect(generateAttempt('template-1', 'student-2')).resolves.toEqual({ id: 'generated-attempt' })
    expect(generateExamAttemptMock).toHaveBeenCalledWith('template-1', 'student-2')
  })

  it('should forbid non-admin student from creating an exam template', async () => {
    requirePermissionMock.mockRejectedValue(new UnauthorizedError())
    const { createExamTemplate } = await import('../../server/actions/exam.actions')

    await expect(createExamTemplate({ name: 'Exam' })).rejects.toThrow(UnauthorizedError)
    expect(createTemplateMock).not.toHaveBeenCalled()
  })

  it('should deny anonymous admin workflow action requests', async () => {
    requirePermissionMock.mockImplementation(async () => {
      console.log('requirePermissionMock called')
      throw new UnauthorizedError()
    })
    const { bulkPublishQuestionsAction } = await import('../../features/admin/actions/editorial-workflow.actions')

    await expect(bulkPublishQuestionsAction(['q1'])).rejects.toThrow(UnauthorizedError)
    expect(bulkUpdateQuestionStatusMock).not.toHaveBeenCalled()
  })

  it('should forbid student from updating another student goal progress', async () => {
    requireStudentMock.mockResolvedValue({ user: { id: 'student-1', role: 'STUDENT' } })
    const { updateGoalProgressAction } = await import('../../server/actions/progress-insights.actions')

    await expect(updateGoalProgressAction('student-2', { weeklyStudyGoalMinutes: 30 })).rejects.toThrow(ForbiddenError)
    expect(updateGoalsMock).not.toHaveBeenCalled()
  })

  it('should allow admin to update another student goal progress', async () => {
    requireStudentMock.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } })
    updateGoalsMock.mockResolvedValue({})
    const { updateGoalProgressAction } = await import('../../server/actions/progress-insights.actions')

    await expect(updateGoalProgressAction('student-2', { weeklyStudyGoalMinutes: 30 })).resolves.toBeDefined()
    expect(updateGoalsMock).toHaveBeenCalledWith('student-2', { weeklyStudyGoalMinutes: 30 })
  })

  it('should forbid cross-user exam attempt loading', async () => {
    console.log('before import loadAttemptAction')
    requireStudentMock.mockResolvedValue({ user: { id: 'student-1', role: 'STUDENT' } })
    loadAttemptMock.mockResolvedValue({ id: 'attempt-1', studentId: 'student-2' })
    const { loadAttemptAction } = await import('../../server/actions/exam-attempt.actions')
    console.log('after import loadAttemptAction')

    console.log('before call loadAttemptAction')
    await expect(loadAttemptAction('attempt-1')).rejects.toThrow(ForbiddenError)
    console.log('after expect loadAttemptAction')
    expect(loadAttemptMock).toHaveBeenCalledWith('attempt-1')
  }, 10000)

  it('should forbid bookmark actions for a different student attempt', async () => {
    requireStudentMock.mockResolvedValue({ user: { id: 'student-1', role: 'STUDENT' } })
    loadAttemptByQuestionMock.mockResolvedValue({ id: 'attempt-1', studentId: 'student-2' })
    const { bookmarkAction } = await import('../../server/actions/exam-attempt.actions')

    await expect(bookmarkAction('question-1', true)).rejects.toThrow(ForbiddenError)
    expect(bookmarkQuestionMock).not.toHaveBeenCalled()
  }, 10000)

  it('should forbid progress insights access for a different student', async () => {
    requireStudentMock.mockResolvedValue({ user: { id: 'student-1', role: 'STUDENT' } })
    const { getProgressInsightsAction } = await import('../../server/actions/progress-insights.actions')

    await expect(getProgressInsightsAction('student-2')).rejects.toThrow(ForbiddenError)
    expect(getProgressInsightsMock).not.toHaveBeenCalled()
  })

  it('should forbid achievement access for a different student', async () => {
    requireStudentMock.mockResolvedValue({ user: { id: 'student-1', role: 'STUDENT' } })
    const { getAchievementsAction } = await import('../../server/actions/achievement.actions')

    await expect(getAchievementsAction('student-2')).rejects.toThrow(ForbiddenError)
    expect(getAchievementsMock).not.toHaveBeenCalled()
  }, 10000)
})
