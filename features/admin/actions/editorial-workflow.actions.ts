"use server"

import {
  addLessonReviewComment,
  addReviewComment,
  approveLessonReview,
  archiveQuestion,
  assignLessonReviewer,
  assignReviewer,
  bulkAssignReviewerToQuestions,
  bulkApproveWorkflowQuestions,
  bulkUpdateLessonReviewQueue,
  bulkUpdateReviewQueue,
  compareVersions,
  createLessonVersionSnapshot,
  createVersionSnapshot,
  EditorialStatus,
  getEditorialWorkflow,
  getLessonEditorialWorkflow,
  publishLesson,
  publishQuestion,
  rejectLessonReview,
  restoreArchivedQuestion,
  restoreLessonVersion,
  restoreVersion,
  sendLessonBackToDraft,
  submitLessonForReview,
  unpublishLesson,
  unpublishQuestion,
  updateEditorialStatus,
  updateLessonEditorialStatus,
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

export async function getLessonEditorialWorkflowAction(lessonId: string) {
  await requirePermission('manageModules')
  return getLessonEditorialWorkflow(lessonId)
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

export async function createLessonVersionSnapshotAction(lessonId: string, summary: string, author = 'Editor') {
  await requirePermission('manageModules')
  return createLessonVersionSnapshot(lessonId, summary, author)
}

export async function compareVersionsAction(questionId: string, fromVersion: number, toVersion: number) {
  await requirePermission('manageQuestions')
  return compareVersions(questionId, fromVersion, toVersion)
}

export async function restoreVersionAction(questionId: string, versionId: string) {
  await requirePermission('manageQuestions')
  return restoreVersion(questionId, versionId)
}

export async function restoreLessonVersionAction(lessonId: string, versionId: string) {
  await requirePermission('manageModules')
  return restoreLessonVersion(lessonId, versionId)
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

export async function updateLessonEditorialStatusAction(lessonId: string, status: EditorialStatus, actor = 'Admin', comment?: string) {
  await requirePermission('manageModules')
  return updateLessonEditorialStatus(lessonId, status, actor, comment)
}

export async function submitLessonForReviewAction(lessonId: string, actor = 'Admin', comment?: string) {
  await requirePermission('manageModules')
  return submitLessonForReview(lessonId, actor, comment)
}

export async function approveLessonReviewAction(lessonId: string, actor = 'Admin') {
  await requirePermission('manageModules')
  return approveLessonReview(lessonId, actor)
}

export async function rejectLessonReviewAction(lessonId: string, reason: string, actor = 'Admin') {
  await requirePermission('manageModules')
  return rejectLessonReview(lessonId, reason, actor)
}

export async function sendLessonBackToDraftAction(lessonId: string, actor = 'Admin', comment?: string) {
  await requirePermission('manageModules')
  return sendLessonBackToDraft(lessonId, actor, comment)
}

export async function publishLessonAction(lessonId: string, actor = 'Admin') {
  await requirePermission('manageModules')
  return publishLesson(lessonId, actor)
}

export async function unpublishLessonAction(lessonId: string, actor = 'Admin') {
  await requirePermission('manageModules')
  return unpublishLesson(lessonId, actor)
}

export async function addLessonReviewCommentAction(lessonId: string, reviewId: string, comment: string, actor = 'Reviewer') {
  await requirePermission('manageModules')
  return addLessonReviewComment(lessonId, reviewId, comment, actor)
}

export async function assignLessonReviewerAction(lessonId: string, reviewId: string, reviewer: string) {
  await requirePermission('manageModules')
  return assignLessonReviewer(lessonId, reviewId, reviewer)
}

export async function bulkUpdateLessonReviewQueueAction(lessonId: string, reviewIds: string[], status: EditorialStatus) {
  await requirePermission('manageModules')
  return bulkUpdateLessonReviewQueue(lessonId, reviewIds, status)
}

export async function bulkApproveWorkflowQuestionsAction(questionIds: string[]) {
  await requirePermission('manageQuestions')
  return bulkApproveWorkflowQuestions(questionIds, 'Admin')
}
