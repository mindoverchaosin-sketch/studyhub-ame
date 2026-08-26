import { beforeEach, describe, expect, it, vi } from 'vitest'

class NotFoundError extends Error {
  constructor(message = 'Resource not found.') {
    super(message)
    this.name = 'NotFoundError'
    ;(this as any).status = 404
  }
}

class ForbiddenError extends Error {
  constructor(message = 'Access denied.') {
    super(message)
    this.name = 'ForbiddenError'
    ;(this as any).status = 403
  }
}

const mockRequireStudent = vi.fn()
const mockRequirePermission = vi.fn()
const mockRequireOwnership = vi.fn(() => undefined)

vi.mock('@/auth', () => ({
  requireStudent: mockRequireStudent,
  requirePermission: mockRequirePermission,
  requireOwnership: mockRequireOwnership,
  NotFoundError,
  ForbiddenError,
}))

const mockAttemptService = {
  loadAttempt: vi.fn(),
  loadAttemptByQuestion: vi.fn(),
  saveAnswer: vi.fn(),
  bookmarkQuestion: vi.fn(),
  markForReview: vi.fn(),
  submitAttempt: vi.fn(),
  listExamHistory: vi.fn(),
  loadAttemptResults: vi.fn(),
}

vi.mock('@/server/services/exam-attempt.service', () => mockAttemptService)

const mockCompletionService = {
  processCompletedAttempt: vi.fn(),
}

vi.mock('@/server/services/exam-completion.service', () => mockCompletionService)

function studentSession(id = 'student-1') {
  return { user: { id, role: 'STUDENT' } }
}

describe('Exam Attempt Actions - Authorization Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireOwnership.mockImplementation(() => undefined)
    mockRequirePermission.mockReset()
    mockRequireStudent.mockReset()
  })

  describe('listExamHistoryAction - Privilege Escalation Prevention', () => {
    it('allows STUDENT to view their own history', async () => {
      const { listExamHistoryAction } = await import(
        '@/server/actions/exam-attempt.actions'
      )

      mockRequireStudent.mockResolvedValue(studentSession())
      mockAttemptService.listExamHistory.mockResolvedValue([
        { id: 'attempt-1', studentId: 'student-1' },
      ])

      const result = await listExamHistoryAction('student-1')

      expect(mockRequireStudent).toHaveBeenCalled()
      expect(mockRequirePermission).not.toHaveBeenCalled()
      expect(mockRequireOwnership).toHaveBeenCalledWith('student-1', 'student-1')
      expect(mockAttemptService.listExamHistory).toHaveBeenCalledWith('student-1')
      expect(result).toEqual([{ id: 'attempt-1', studentId: 'student-1' }])
    })

    it("denies STUDENT from viewing another student's history", async () => {
      const { listExamHistoryAction } = await import(
        '@/server/actions/exam-attempt.actions'
      )

      mockRequireStudent.mockResolvedValue(studentSession())
      mockRequireOwnership.mockImplementation(() => {
        throw new ForbiddenError('Access denied.')
      })

      await expect(listExamHistoryAction('student-2')).rejects.toThrow(ForbiddenError)
      expect(mockRequireOwnership).toHaveBeenCalledWith('student-2', 'student-1')
      expect(mockAttemptService.listExamHistory).not.toHaveBeenCalled()
    })

    it("allows APPROVED ADMIN to view any student's history", async () => {
      const { listExamHistoryAction } = await import(
        '@/server/actions/exam-attempt.actions'
      )
      const adminSession = { user: { id: 'admin-1', role: 'ADMIN' } }

      mockRequireStudent.mockResolvedValue(adminSession)
      mockRequirePermission.mockResolvedValue(adminSession)
      mockAttemptService.listExamHistory.mockResolvedValue([
        { id: 'attempt-1', studentId: 'student-2' },
      ])

      const result = await listExamHistoryAction('student-2')

      expect(mockRequireStudent).toHaveBeenCalled()
      expect(mockRequirePermission).toHaveBeenCalledWith('viewAnalytics')
      expect(mockRequireOwnership).not.toHaveBeenCalled()
      expect(mockAttemptService.listExamHistory).toHaveBeenCalledWith('student-2')
      expect(result).toEqual([{ id: 'attempt-1', studentId: 'student-2' }])
    })

    it('denies PENDING ADMIN via requirePermission check', async () => {
      const { listExamHistoryAction } = await import(
        '@/server/actions/exam-attempt.actions'
      )
      const pendingAdminSession = { user: { id: 'admin-pending', role: 'ADMIN' } }

      mockRequireStudent.mockResolvedValue(pendingAdminSession)
      mockRequirePermission.mockRejectedValue(
        new ForbiddenError('Admin access is pending approval or suspended.')
      )

      await expect(listExamHistoryAction('student-2')).rejects.toThrow(
        'Admin access is pending approval or suspended.'
      )
      expect(mockRequirePermission).toHaveBeenCalledWith('viewAnalytics')
      expect(mockRequireOwnership).not.toHaveBeenCalled()
      expect(mockAttemptService.listExamHistory).not.toHaveBeenCalled()
    })

    it("allows SUPER_ADMIN to view any student's history", async () => {
      const { listExamHistoryAction } = await import(
        '@/server/actions/exam-attempt.actions'
      )
      const superAdminSession = { user: { id: 'super-admin', role: 'SUPER_ADMIN' } }

      mockRequireStudent.mockResolvedValue(superAdminSession)
      mockRequirePermission.mockResolvedValue(superAdminSession)
      mockAttemptService.listExamHistory.mockResolvedValue([
        { id: 'attempt-1', studentId: 'student-3' },
      ])

      const result = await listExamHistoryAction('student-3')

      expect(mockRequirePermission).toHaveBeenCalledWith('viewAnalytics')
      expect(mockRequireOwnership).not.toHaveBeenCalled()
      expect(result).toEqual([{ id: 'attempt-1', studentId: 'student-3' }])
    })

    it('requires authentication before listing history', async () => {
      const { listExamHistoryAction } = await import(
        '@/server/actions/exam-attempt.actions'
      )

      mockRequireStudent.mockRejectedValue(new Error('Authentication required.'))

      await expect(listExamHistoryAction('student-1')).rejects.toThrow('Authentication required.')
      expect(mockAttemptService.listExamHistory).not.toHaveBeenCalled()
    })
  })

  describe('loadAttemptAction - ownership enforcement', () => {
    it('returns null for a missing attempt without an ownership check', async () => {
      const { loadAttemptAction } = await import('@/server/actions/exam-attempt.actions')

      mockRequireStudent.mockResolvedValue(studentSession())
      mockAttemptService.loadAttempt.mockResolvedValue(null)

      await expect(loadAttemptAction('missing-attempt')).resolves.toBeNull()
      expect(mockRequireOwnership).not.toHaveBeenCalled()
    })

    it('returns the attempt to its owner', async () => {
      const { loadAttemptAction } = await import('@/server/actions/exam-attempt.actions')
      const attempt = { id: 'attempt-1', studentId: 'student-1' }

      mockRequireStudent.mockResolvedValue(studentSession())
      mockAttemptService.loadAttempt.mockResolvedValue(attempt)

      await expect(loadAttemptAction('attempt-1')).resolves.toEqual(attempt)
      expect(mockRequireOwnership).toHaveBeenCalledWith('student-1', 'student-1')
    })

    it("forbids loading another student's attempt", async () => {
      const { loadAttemptAction } = await import('@/server/actions/exam-attempt.actions')

      mockRequireStudent.mockResolvedValue(studentSession())
      mockAttemptService.loadAttempt.mockResolvedValue({ id: 'attempt-1', studentId: 'student-2' })
      mockRequireOwnership.mockImplementation(() => {
        throw new ForbiddenError('Access denied.')
      })

      await expect(loadAttemptAction('attempt-1')).rejects.toThrow(ForbiddenError)
    })

    it('requires authentication first', async () => {
      const { loadAttemptAction } = await import('@/server/actions/exam-attempt.actions')

      mockRequireStudent.mockRejectedValue(new Error('Authentication required.'))

      await expect(loadAttemptAction('attempt-1')).rejects.toThrow('Authentication required.')
      expect(mockAttemptService.loadAttempt).not.toHaveBeenCalled()
    })
  })

  describe('saveAnswerAction - question-level ownership', () => {
    it('throws NotFoundError when the attempt for the question is missing', async () => {
      const { saveAnswerAction } = await import('@/server/actions/exam-attempt.actions')

      mockRequireStudent.mockResolvedValue(studentSession())
      mockAttemptService.loadAttemptByQuestion.mockResolvedValue(null)

      await expect(saveAnswerAction('missing-question', 1)).rejects.toThrow(NotFoundError)
      expect(mockAttemptService.saveAnswer).not.toHaveBeenCalled()
    })

    it("forbids answering another student's attempt question", async () => {
      const { saveAnswerAction } = await import('@/server/actions/exam-attempt.actions')

      mockRequireStudent.mockResolvedValue(studentSession())
      mockAttemptService.loadAttemptByQuestion.mockResolvedValue({
        id: 'attempt-1',
        studentId: 'student-2',
      })
      mockRequireOwnership.mockImplementation(() => {
        throw new ForbiddenError('Access denied.')
      })

      await expect(saveAnswerAction('question-1', 2)).rejects.toThrow(ForbiddenError)
      expect(mockAttemptService.saveAnswer).not.toHaveBeenCalled()
    })

    it('delegates the answer payload with an answered timestamp', async () => {
      const { saveAnswerAction } = await import('@/server/actions/exam-attempt.actions')

      mockRequireStudent.mockResolvedValue(studentSession())
      mockAttemptService.loadAttemptByQuestion.mockResolvedValue({
        id: 'attempt-1',
        studentId: 'student-1',
      })
      mockAttemptService.saveAnswer.mockResolvedValue({ id: 'attempt-question-1', selectedOption: 2 })

      const result = await saveAnswerAction('question-1', 2)

      expect(mockAttemptService.saveAnswer).toHaveBeenCalledWith(
        'question-1',
        expect.objectContaining({ selectedOption: 2, answeredAt: expect.any(Date) })
      )
      expect(result).toEqual({ id: 'attempt-question-1', selectedOption: 2 })
    })
  })

  describe('bookmarkAction and markForReviewAction - question-level ownership', () => {
    it.each([
      ['bookmarkAction', 'bookmarkQuestion', true],
      ['markForReviewAction', 'markForReview', true],
    ] as const)('%s delegates for the owning student', async (actionName, serviceName, flag) => {
      const actionModule = await import('@/server/actions/exam-attempt.actions')
      const action = actionModule[actionName]

      mockRequireStudent.mockResolvedValue(studentSession())
      mockAttemptService.loadAttemptByQuestion.mockResolvedValue({
        id: 'attempt-1',
        studentId: 'student-1',
      })
      mockAttemptService[serviceName].mockResolvedValue({ id: 'attempt-question-1' })

      await action('question-1', flag)

      expect(mockRequireOwnership).toHaveBeenCalledWith('student-1', 'student-1')
      expect(mockAttemptService[serviceName]).toHaveBeenCalledWith('question-1', flag)
    })

    it.each([
      ['bookmarkAction'],
      ['markForReviewAction'],
    ] as const)('%s throws NotFoundError when attempt is missing', async (actionName) => {
      const actionModule = await import('@/server/actions/exam-attempt.actions')
      const action = actionModule[actionName]

      mockRequireStudent.mockResolvedValue(studentSession())
      mockAttemptService.loadAttemptByQuestion.mockResolvedValue(null)

      await expect(action('missing-question', true)).rejects.toThrow(NotFoundError)
    })

    it('denies bookmarking another student\'s attempt question', async () => {
      const { bookmarkAction } = await import('@/server/actions/exam-attempt.actions')

      mockRequireStudent.mockResolvedValue(studentSession())
      mockAttemptService.loadAttemptByQuestion.mockResolvedValue({
        id: 'attempt-1',
        studentId: 'student-2',
      })
      mockRequireOwnership.mockImplementation(() => {
        throw new ForbiddenError('Access denied.')
      })

      await expect(bookmarkAction('question-1', true)).rejects.toThrow(ForbiddenError)
      expect(mockAttemptService.bookmarkQuestion).not.toHaveBeenCalled()
    })
  })

  describe('submitAttemptAction - submission boundaries', () => {
    it('throws NotFoundError when the attempt is missing', async () => {
      const { submitAttemptAction } = await import('@/server/actions/exam-attempt.actions')

      mockRequireStudent.mockResolvedValue(studentSession())
      mockAttemptService.loadAttempt.mockResolvedValue(null)

      await expect(submitAttemptAction('missing-attempt')).rejects.toThrow(NotFoundError)
      expect(mockAttemptService.submitAttempt).not.toHaveBeenCalled()
    })

    it("forbids submitting another student's attempt", async () => {
      const { submitAttemptAction } = await import('@/server/actions/exam-attempt.actions')

      mockRequireStudent.mockResolvedValue(studentSession())
      mockAttemptService.loadAttempt.mockResolvedValue({ id: 'attempt-1', studentId: 'student-2' })
      mockRequireOwnership.mockImplementation(() => {
        throw new ForbiddenError('Access denied.')
      })

      await expect(submitAttemptAction('attempt-1')).rejects.toThrow(ForbiddenError)
      expect(mockAttemptService.submitAttempt).not.toHaveBeenCalled()
    })

    it('submits an owned attempt', async () => {
      const { submitAttemptAction } = await import('@/server/actions/exam-attempt.actions')
      const submitted = { id: 'attempt-1', status: 'SUBMITTED', score: 80 }

      mockRequireStudent.mockResolvedValue(studentSession())
      mockAttemptService.loadAttempt.mockResolvedValue({ id: 'attempt-1', studentId: 'student-1' })
      mockAttemptService.submitAttempt.mockResolvedValue(submitted)

      await expect(submitAttemptAction('attempt-1')).resolves.toEqual(submitted)
      expect(mockAttemptService.submitAttempt).toHaveBeenCalledWith('attempt-1')
    })
  })

  describe('processCompletedAttemptAction - completion boundaries', () => {
    it("forbids processing another student's completed attempt", async () => {
      const { processCompletedAttemptAction } = await import(
        '@/server/actions/exam-attempt.actions'
      )

      mockRequireStudent.mockResolvedValue(studentSession())
      mockAttemptService.loadAttempt.mockResolvedValue({ id: 'attempt-1', studentId: 'student-2' })
      mockRequireOwnership.mockImplementation(() => {
        throw new ForbiddenError('Access denied.')
      })

      await expect(processCompletedAttemptAction('attempt-1')).rejects.toThrow(ForbiddenError)
      expect(mockCompletionService.processCompletedAttempt).not.toHaveBeenCalled()
    })

    it('processes an owned completed attempt through the completion service', async () => {
      const { processCompletedAttemptAction } = await import(
        '@/server/actions/exam-attempt.actions'
      )
      const completionResult = { id: 'attempt-1', processed: true }

      mockRequireStudent.mockResolvedValue(studentSession())
      mockAttemptService.loadAttempt.mockResolvedValue({ id: 'attempt-1', studentId: 'student-1' })
      mockCompletionService.processCompletedAttempt.mockResolvedValue(completionResult)

      await expect(processCompletedAttemptAction('attempt-1')).resolves.toEqual(completionResult)
      expect(mockCompletionService.processCompletedAttempt).toHaveBeenCalledWith('attempt-1')
    })
  })

  describe('loadAttemptResultsAction - results access', () => {
    it('returns null when the attempt is missing', async () => {
      const { loadAttemptResultsAction } = await import(
        '@/server/actions/exam-attempt.actions'
      )

      mockRequireStudent.mockResolvedValue(studentSession())
      mockAttemptService.loadAttempt.mockResolvedValue(null)

      await expect(loadAttemptResultsAction('missing-attempt')).resolves.toBeNull()
      expect(mockAttemptService.loadAttemptResults).not.toHaveBeenCalled()
    })

    it("denies another student's results without loading them", async () => {
      const { loadAttemptResultsAction } = await import(
        '@/server/actions/exam-attempt.actions'
      )

      mockRequireStudent.mockResolvedValue(studentSession())
      mockAttemptService.loadAttempt.mockResolvedValue({ id: 'attempt-1', studentId: 'student-2' })
      mockRequireOwnership.mockImplementation(() => {
        throw new ForbiddenError('Access denied.')
      })

      await expect(loadAttemptResultsAction('attempt-1')).rejects.toThrow(ForbiddenError)
      expect(mockAttemptService.loadAttemptResults).not.toHaveBeenCalled()
    })

    it('returns results to the owning student', async () => {
      const { loadAttemptResultsAction } = await import(
        '@/server/actions/exam-attempt.actions'
      )
      const results = { attemptId: 'attempt-1', score: 90, passed: true }

      mockRequireStudent.mockResolvedValue(studentSession())
      mockAttemptService.loadAttempt.mockResolvedValue({ id: 'attempt-1', studentId: 'student-1' })
      mockAttemptService.loadAttemptResults.mockResolvedValue(results)

      await expect(loadAttemptResultsAction('attempt-1')).resolves.toEqual(results)
      expect(mockAttemptService.loadAttemptResults).toHaveBeenCalledWith('attempt-1')
    })
  })

  describe('Premium entitlement boundary relationship', () => {
    it('keeps premium gating out of attempt lifecycle actions', async () => {
      const { submitAttemptAction, loadAttemptAction } = await import(
        '@/server/actions/exam-attempt.actions'
      )

      mockRequireStudent.mockResolvedValue(studentSession())
      mockAttemptService.loadAttempt.mockResolvedValue({ id: 'attempt-1', studentId: 'student-1' })
      mockAttemptService.submitAttempt.mockResolvedValue({ id: 'attempt-1', status: 'SUBMITTED' })

      await loadAttemptAction('attempt-1')
      await submitAttemptAction('attempt-1')

      expect(mockRequirePermission).not.toHaveBeenCalled()
    })
  })
})
