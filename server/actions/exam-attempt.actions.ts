import * as attemptService from '@/server/services/exam-attempt.service'
import * as completionService from '@/server/services/exam-completion.service'
import { requireStudent, requireAdmin, requireOwnership, NotFoundError, ForbiddenError } from '@/auth'

export async function loadAttemptAction(attemptId: string) {
  const session = await requireStudent()
  const attempt = await attemptService.loadAttempt(attemptId)
  if (!attempt) return null
  requireOwnership(attempt.studentId, session.user.id)

  return attempt
}

export async function saveAnswerAction(attemptQuestionId: string, selectedOption: number | null) {
  const session = await requireStudent()
  const attempt = await attemptService.loadAttemptByQuestion(attemptQuestionId)
  if (!attempt) throw new NotFoundError('Attempt not found.')
  requireOwnership(attempt.studentId, session.user.id)

  return attemptService.saveAnswer(attemptQuestionId, { selectedOption, answeredAt: new Date() })
}

export async function bookmarkAction(attemptQuestionId: string, bookmarked: boolean) {
  const session = await requireStudent()
  const attempt = await attemptService.loadAttemptByQuestion(attemptQuestionId)
  if (!attempt) throw new NotFoundError('Attempt not found.')
  requireOwnership(attempt.studentId, session.user.id)

  return attemptService.bookmarkQuestion(attemptQuestionId, bookmarked)
}

export async function markForReviewAction(attemptQuestionId: string, markedForReview: boolean) {
  const session = await requireStudent()
  const attempt = await attemptService.loadAttemptByQuestion(attemptQuestionId)
  if (!attempt) throw new NotFoundError('Attempt not found.')
  requireOwnership(attempt.studentId, session.user.id)

  return attemptService.markForReview(attemptQuestionId, markedForReview)
}

export async function submitAttemptAction(attemptId: string) {
  const session = await requireStudent()
  const attempt = await attemptService.loadAttempt(attemptId)
  if (!attempt) throw new NotFoundError('Attempt not found.')
  requireOwnership(attempt.studentId, session.user.id)

  return attemptService.submitAttempt(attemptId)
}

export async function processCompletedAttemptAction(attemptId: string) {
  const session = await requireStudent()
  const attempt = await attemptService.loadAttempt(attemptId)
  if (!attempt) throw new NotFoundError('Attempt not found.')
  requireOwnership(attempt.studentId, session.user.id)

  return completionService.processCompletedAttempt(attemptId)
}

export async function loadAttemptResultsAction(attemptId: string) {
  const session = await requireStudent()
  const attempt = await attemptService.loadAttempt(attemptId)
  if (!attempt) return null
  requireOwnership(attempt.studentId, session.user.id)

  return attemptService.loadAttemptResults(attemptId)
}

export async function listExamHistoryAction(studentId: string) {
  const session = await requireStudent()
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    requireOwnership(studentId, session.user.id)
  }

  return attemptService.listExamHistory(studentId)
}
