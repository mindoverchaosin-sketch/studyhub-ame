'use server'

import { requireStudent } from '@/auth'
import { contentAccessService } from '@/server/services/content-access.service'
import { questionBankRepository } from '@/server/repositories/question-bank.repository'
import { questionRepository } from '@/server/repositories/question.repository'
import { getStudentStudyMaterialAccess } from '@/server/services/resource.service'

/**
 * Server action: Verify student can access a question bank
 * Called before rendering or accessing questions from a premium QB
 */
export async function canAccessQuestionBankAction(questionBankId: string, _qbIsPremium?: boolean) {
  void _qbIsPremium
  const session = await requireStudent()
  const questionBank = await questionBankRepository.findById(questionBankId)

  if (!questionBank) {
    return { allowed: false, reason: 'Question bank not found' }
  }
  if (questionBank.status !== 'PUBLISHED' || questionBank.deletedAt) {
    return { allowed: false, reason: 'Question bank not found' }
  }

  return contentAccessService.canAccessQuestionBank(session.user.id, questionBank.isPremium)
}

/**
 * Server action: Verify student can access a specific question
 * Inherits access from parent question bank
 */
export async function canAccessQuestionAction(questionBankId: string, questionId: string, _qbIsPremium?: boolean) {
  void _qbIsPremium
  const session = await requireStudent()
  const question = await questionRepository.findById(questionId)

  if (
    !question
    || question.questionBankId !== questionBankId
    || question.status !== 'PUBLISHED'
    || question.deletedAt
  ) {
    return { allowed: false, reason: 'Question not found' }
  }

  const questionBank = await questionBankRepository.findById(question.questionBankId)
  if (!questionBank || questionBank.status !== 'PUBLISHED' || questionBank.deletedAt) {
    return { allowed: false, reason: 'Question bank not found' }
  }

  return contentAccessService.canAccessQuestion(session.user.id, questionBank.isPremium)
}

/**
 * Server action: Verify student can download a study material
 * Requires downloadResources entitlement for premium materials
 */
export async function canDownloadStudyMaterialAction(materialId: string) {
  const session = await requireStudent()
  const access = await getStudentStudyMaterialAccess(session.user.id, materialId)
  if (!access) return { allowed: false, reason: 'Study material not found' }
  if (!access.allowed) return access
  return contentAccessService.canDownloadStudyMaterial(session.user.id, access.premiumRequired)
}

/**
 * Server action: Verify student can view a study material
 * Requires premiumModules entitlement for premium materials
 */
export async function canAccessStudyMaterialAction(materialId: string) {
  const session = await requireStudent()
  const access = await getStudentStudyMaterialAccess(session.user.id, materialId)
  return access ? { allowed: access.allowed, reason: access.reason } : { allowed: false, reason: 'Study material not found' }
}

/**
 * Server action: Initiate study material download
 * Checks both view AND download entitlements before allowing download
 */
export async function initiateStudyMaterialDownloadAction(materialId: string) {
  const session = await requireStudent()

  const materialAccess = await getStudentStudyMaterialAccess(session.user.id, materialId)
  if (!materialAccess) throw new Error('Study material not found.')
  if (!materialAccess.allowed) throw new Error(materialAccess.reason || 'Access denied: Cannot view this material')

  const downloadAccess = await contentAccessService.canDownloadStudyMaterial(
    session.user.id,
    materialAccess.premiumRequired,
  )
  if (!downloadAccess.allowed) {
    throw new Error(downloadAccess.reason || 'Download access denied: This requires premium download feature')
  }

  // Return success signal (actual download handled by API route)
  return {
    allowed: true,
    materialId,
    userId: session.user.id,
    timestamp: new Date().toISOString(),
  }
}
