'use server'

import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/auth'
import { withAuditLogging } from '@/server/actions/audit-helpers'
import { quizManagementService, type QuizManagementFilters, type QuizManagementInput } from '@/server/services/quiz-management.service'
import type { Status } from '@prisma/client'

function revalidateQuizPaths(moduleId?: string) {
  revalidatePath('/admin/quizzes')
  revalidatePath('/content-editor/quizzes')
  revalidatePath('/admin/modules')
  if (moduleId) {
    revalidatePath(`/admin/modules/${moduleId}`)
    revalidatePath(`/content-editor/modules/${moduleId}`)
  }
}

export async function listAdminQuizzes(filters: QuizManagementFilters = {}) {
  await requirePermission('manageModules')
  return quizManagementService.list(filters)
}

export async function createAdminQuiz(input: QuizManagementInput) {
  await requirePermission('manageModules')
  const result = await withAuditLogging({
    permission: 'manageModules',
    action: 'quiz.create',
    entityType: 'QUIZ',
    metadata: { source: 'quiz-management' },
    run: async () => quizManagementService.create(input),
  })
  revalidateQuizPaths(result.moduleId)
  return result
}

export async function updateAdminQuiz(id: string, input: QuizManagementInput) {
  await requirePermission('manageModules')
  const result = await withAuditLogging({
    permission: 'manageModules',
    action: 'quiz.update',
    entityType: 'QUIZ',
    entityId: id,
    metadata: { source: 'quiz-management' },
    run: async () => quizManagementService.update(id, input),
  })
  revalidateQuizPaths(result.moduleId)
  return result
}

export async function setAdminQuizStatus(id: string, status: Extract<Status, 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>) {
  if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
    throw new Error('Unsupported quiz status.')
  }
  await requirePermission(status === 'PUBLISHED' ? 'publishContent' : 'manageModules')
  const result = await withAuditLogging({
    permission: status === 'PUBLISHED' ? 'publishContent' : 'manageModules',
    action: status === 'ARCHIVED' ? 'quiz.archive' : status === 'PUBLISHED' ? 'quiz.publish' : 'quiz.unpublish',
    entityType: 'QUIZ',
    entityId: id,
    metadata: { source: 'quiz-management' },
    run: async () => quizManagementService.setStatus(id, status),
  })
  revalidateQuizPaths(result.moduleId)
  return result
}

export async function setCanonicalModuleQuiz(moduleId: string, quizId: string | null) {
  await requirePermission('manageModules')
  const result = await withAuditLogging({
    permission: 'manageModules',
    action: 'module.canonical-quiz.change',
    entityType: 'MODULE',
    entityId: moduleId,
    metadata: { source: 'quiz-management', canonicalQuizId: quizId },
    run: async () => quizManagementService.setCanonicalQuiz(moduleId, quizId),
  })
  revalidateQuizPaths(moduleId)
  return result
}
