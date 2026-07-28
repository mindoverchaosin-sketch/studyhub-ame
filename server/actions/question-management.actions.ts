'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/auth'
import { withAuditLogging } from '@/server/actions/audit-helpers'
import { bulkQuestionManagementService } from '@/server/services/bulk-question-management.service'
import { questionExportService } from '@/server/services/question-export.service'
import { questionImportService } from '@/server/services/question-import.service'
import { questionManagementService } from '@/server/services/question-management.service'

export async function createQuestionAction(input: Record<string, unknown>) {
  await requirePermission('manageQuestions')
  const result = await withAuditLogging({
    permission: 'manageQuestions',
    action: 'question.create',
    entityType: 'QUESTION',
    metadata: { source: 'question-management' },
    run: async () => {
      const created = await questionManagementService.createQuestion(input as any)
      revalidatePath('/admin/questions')
      return created
    },
  })
  return result
}

export async function updateQuestionAction(questionId: string, input: Record<string, unknown>) {
  await requirePermission('manageQuestions')
  const result = await withAuditLogging({
    permission: 'manageQuestions',
    action: 'question.update',
    entityType: 'QUESTION',
    entityId: questionId,
    metadata: { source: 'question-management' },
    run: async () => {
      const updated = await questionManagementService.updateQuestion(questionId, input as any)
      revalidatePath('/admin/questions')
      return updated
    },
  })
  return result
}

export async function archiveQuestionAction(questionId: string) {
  await requirePermission('manageQuestions')
  const result = await withAuditLogging({
    permission: 'manageQuestions',
    action: 'question.archive',
    entityType: 'QUESTION',
    entityId: questionId,
    metadata: { source: 'question-management' },
    run: async () => {
      const archived = await questionManagementService.archiveQuestion(questionId)
      revalidatePath('/admin/questions')
      return archived
    },
  })
  return result
}

export async function unarchiveQuestionAction(questionId: string) {
  await requirePermission('manageQuestions')
  const result = await withAuditLogging({
    permission: 'manageQuestions',
    action: 'question.unarchive',
    entityType: 'QUESTION',
    entityId: questionId,
    metadata: { source: 'question-management' },
    run: async () => {
      const restored = await questionManagementService.unarchiveQuestion(questionId)
      revalidatePath('/admin/questions')
      return restored
    },
  })
  return result
}

export async function getQuestionAction(questionId: string) {
  await requirePermission('manageQuestions')
  return questionManagementService.getQuestion(questionId)
}

export async function bulkArchiveQuestions(questionIds: string[]) {
  await requirePermission('manageQuestions')
  const result = await bulkQuestionManagementService.archiveQuestions(questionIds)
  revalidatePath('/admin/questions')
  return result
}

export async function bulkRestoreQuestions(questionIds: string[]) {
  await requirePermission('manageQuestions')
  const result = await bulkQuestionManagementService.restoreQuestions(questionIds)
  revalidatePath('/admin/questions')
  return result
}

export async function bulkUpdateQuestionModule(questionIds: string[], questionBankId: string) {
  await requirePermission('manageQuestions')
  const result = await bulkQuestionManagementService.updateModule(questionIds, questionBankId)
  revalidatePath('/admin/questions')
  return result
}

export async function bulkUpdateQuestionDifficulty(questionIds: string[], difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED') {
  await requirePermission('manageQuestions')
  const result = await bulkQuestionManagementService.updateDifficulty(questionIds, difficulty)
  revalidatePath('/admin/questions')
  return result
}

export async function bulkUpdateQuestionTags(questionIds: string[], tags: string[]) {
  await requirePermission('manageQuestions')
  const result = await bulkQuestionManagementService.updateTags(questionIds, tags)
  revalidatePath('/admin/questions')
  return result
}

export async function bulkPublishQuestions(questionIds: string[]) {
  await requirePermission('publishContent')
  const result = await bulkQuestionManagementService.publishQuestions(questionIds)
  revalidatePath('/admin/questions')
  return result
}

export async function bulkUnpublishQuestions(questionIds: string[]) {
  await requirePermission('publishContent')
  const result = await bulkQuestionManagementService.unpublishQuestions(questionIds)
  revalidatePath('/admin/questions')
  return result
}

export async function importQuestions(input: { questionBankId: string; content: string }) {
  await requirePermission('manageQuestions')
  const result = await questionImportService.importQuestions(input)
  revalidatePath('/admin/questions')
  return result
}

export async function exportQuestions(filters: Record<string, unknown>) {
  await requirePermission('manageQuestions')
  return questionExportService.exportQuestions(filters as any)
}

export const bulkArchiveQuestionsAction = bulkArchiveQuestions
export const bulkRestoreQuestionsAction = bulkRestoreQuestions
export const importQuestionsAction = importQuestions
export const exportQuestionsAction = exportQuestions
