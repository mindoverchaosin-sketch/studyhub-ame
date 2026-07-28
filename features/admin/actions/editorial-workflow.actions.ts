"use server"

import {
  addReviewComment,
  assignReviewer,
  archiveQuestion,
  bulkAssignReviewerToQuestions,
  bulkApproveWorkflowQuestions,
  bulkUpdateReviewQueue,
  compareVersions,
  createVersionSnapshot,
  EditorialStatus,
  getEditorialWorkflow,
  publishQuestion,
  restoreArchivedQuestion,
  restoreVersion,
  unpublishQuestion,
  updateEditorialStatus,
} from '@/server/services/editorial-workflow.service'
import {
  bulkUpdateQuestionStatus,
  getAdminQuestionLibrary,
  getQuestionById,
} from '@/server/services/question.service'
import { requirePermission } from '@/auth'

export async function getAdminQuestionLibraryAction(filters: Parameters<typeof getAdminQuestionLibrary>[0]) {
  await requirePermission('manageQuestions')
  return getAdminQuestionLibrary(filters)
}

export async function getQuestionByIdAction(questionId: string) {
  await requirePermission('manageQuestions')
  return getQuestionById(questionId)
}

export async function getEditorialWorkflowAction(questionId: string) {
  await requirePermission('manageQuestions')
  return getEditorialWorkflow(questionId)
}

export async function updateEditorialStatusAction(questionId: string, status: EditorialStatus, actor = 'Admin', comment?: string) {
  await requirePermission('manageQuestions')
  return updateEditorialStatus(questionId, status, actor, comment)
}

export async function addReviewCommentAction(questionId: string, reviewId: string, comment: string, actor = 'Reviewer') {
  await requirePermission('manageQuestions')
  return addReviewComment(questionId, reviewId, comment, actor)
}

export async function assignReviewerAction(questionId: string, reviewId: string, reviewer: string) {
  await requirePermission('manageQuestions')
  return assignReviewer(questionId, reviewId, reviewer)
}

export async function bulkUpdateReviewQueueAction(questionId: string, reviewIds: string[], status: EditorialStatus) {
  await requirePermission('manageQuestions')
  return bulkUpdateReviewQueue(questionId, reviewIds, status)
}

export async function bulkPublishQuestionsAction(questionIds: string[]) {
  await requirePermission('manageQuestions')
  await bulkUpdateQuestionStatus(questionIds, 'PUBLISHED')
  return questionIds
}

export async function bulkArchiveQuestionsAction(questionIds: string[]) {
  await requirePermission('manageQuestions')
  await bulkUpdateQuestionStatus(questionIds, 'ARCHIVED')
  return questionIds
}

export async function bulkApproveQuestionsAction(questionIds: string[]) {
  await requirePermission('manageQuestions')
  return bulkApproveWorkflowQuestions(questionIds)
}

export async function bulkAssignReviewerToQuestionsAction(questionIds: string[], reviewer: string) {
  await requirePermission('manageQuestions')
  return bulkAssignReviewerToQuestions(questionIds, reviewer)
}

export async function createVersionSnapshotAction(questionId: string, summary: string, author = 'Editor') {
  await requirePermission('manageQuestions')
  return createVersionSnapshot(questionId, summary, author)
}

export async function compareVersionsAction(questionId: string, fromVersion: number, toVersion: number) {
  await requirePermission('manageQuestions')
  return compareVersions(questionId, fromVersion, toVersion)
}

export async function restoreVersionAction(questionId: string, versionId: string) {
  await requirePermission('manageQuestions')
  return restoreVersion(questionId, versionId)
}

export async function publishQuestionAction(questionId: string, actor = 'Admin', scheduledFor?: string) {
  await requirePermission('manageQuestions')
  return publishQuestion(questionId, actor, scheduledFor)
}

export async function unpublishQuestionAction(questionId: string, actor = 'Admin') {
  await requirePermission('manageQuestions')
  return unpublishQuestion(questionId, actor)
}

export async function archiveQuestionAction(questionId: string, actor = 'Admin') {
  await requirePermission('manageQuestions')
  return archiveQuestion(questionId, actor)
}

export async function restoreArchivedQuestionAction(questionId: string, actor = 'Admin') {
  await requirePermission('manageQuestions')
  return restoreArchivedQuestion(questionId, actor)
}

export async function bulkApproveWorkflowQuestionsAction(questionIds: string[]) {
  await requirePermission('manageQuestions')
  return bulkApproveWorkflowQuestions(questionIds, 'Admin')
}
