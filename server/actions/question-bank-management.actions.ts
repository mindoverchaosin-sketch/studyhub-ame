'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/auth'
import { withAuditLogging } from '@/server/actions/audit-helpers'
import { questionBankManagementService } from '@/server/services/question-bank-management.service'

export async function createQuestionBankAction(input: Record<string, unknown>) {
  await requirePermission('manageQuestions')
  const result = await withAuditLogging({
    permission: 'manageQuestions',
    action: 'question-bank.create',
    entityType: 'QUESTION_BANK',
    metadata: { source: 'question-bank-management' },
    run: async () => {
      const created = await questionBankManagementService.createQuestionBank(input as any)
      revalidatePath('/admin/questions')
      return created
    },
  })
  return result
}

export async function updateQuestionBankAction(questionBankId: string, input: Record<string, unknown>) {
  await requirePermission('manageQuestions')
  const result = await withAuditLogging({
    permission: 'manageQuestions',
    action: 'question-bank.update',
    entityType: 'QUESTION_BANK',
    entityId: questionBankId,
    metadata: { source: 'question-bank-management' },
    run: async () => {
      const updated = await questionBankManagementService.updateQuestionBank(questionBankId, input as any)
      revalidatePath('/admin/questions')
      return updated
    },
  })
  return result
}

export async function archiveQuestionBankAction(questionBankId: string) {
  await requirePermission('manageQuestions')
  const result = await withAuditLogging({
    permission: 'manageQuestions',
    action: 'question-bank.archive',
    entityType: 'QUESTION_BANK',
    entityId: questionBankId,
    metadata: { source: 'question-bank-management' },
    run: async () => {
      const archived = await questionBankManagementService.archiveQuestionBank(questionBankId)
      revalidatePath('/admin/questions')
      return archived
    },
  })
  return result
}

export async function publishQuestionBankAction(questionBankId: string) {
  await requirePermission('publishContent')
  const result = await withAuditLogging({
    permission: 'publishContent',
    action: 'question-bank.publish',
    entityType: 'QUESTION_BANK',
    entityId: questionBankId,
    metadata: { source: 'question-bank-management' },
    run: async () => {
      const published = await questionBankManagementService.publishQuestionBank(questionBankId)
      revalidatePath('/admin/questions')
      return published
    },
  })
  return result
}

export async function getQuestionBankAction(questionBankId: string) {
  await requirePermission('manageQuestions')
  return questionBankManagementService.getQuestionBank(questionBankId)
}
