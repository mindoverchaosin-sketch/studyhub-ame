'use server'

import { requireStudent } from '@/auth'
import { contentAccessService } from '@/server/services/content-access.service'
import { questionBankRepository } from '@/server/repositories/question-bank.repository'
import { questionRepository } from '@/server/repositories/question.repository'

/**
 * Server action: Verify student can access a question bank
 * Called before rendering or accessing questions from a premium QB
 */
export async function canAccessQuestionBankAction(questionBankId: string, _qbIsPremium?: boolean) {
  const session = await requireStudent()
  const questionBank = await questionBankRepository.findById(questionBankId)

  if (!questionBank) {
    return { allowed: false, reason: 'Question bank not found' }
  }

  return contentAccessService.canAccessQuestionBank(session.user.id, questionBank.isPremium)
}

/**
 * Server action: Verify student can access a specific question
 * Inherits access from parent question bank
 */
export async function canAccessQuestionAction(questionBankId: string, questionId: string, _qbIsPremium?: boolean) {
  const session = await requireStudent()
  const question = await questionRepository.findById(questionId)

  if (!question || question.questionBankId !== questionBankId) {
    return { allowed: false, reason: 'Question not found' }
  }

  const questionBank = await questionBankRepository.findById(question.questionBankId)
  if (!questionBank) {
    return { allowed: false, reason: 'Question bank not found' }
  }

  return contentAccessService.canAccessQuestion(session.user.id, questionBank.isPremium)
}

/**
 * Server action: Verify student can download a study material
 * Requires downloadResources entitlement for premium materials
 */
export async function canDownloadStudyMaterialAction(materialIsPremium: boolean) {
  const session = await requireStudent()

  if (!materialIsPremium) {
    return { allowed: true }
  }

  return contentAccessService.canDownloadStudyMaterial(session.user.id, materialIsPremium)
}

/**
 * Server action: Verify student can view a study material
 * Requires premiumModules entitlement for premium materials
 */
export async function canAccessStudyMaterialAction(materialIsPremium: boolean) {
  const session = await requireStudent()

  if (!materialIsPremium) {
    return { allowed: true }
  }

  return contentAccessService.canAccessStudyMaterial(session.user.id, materialIsPremium)
}

/**
 * Server action: Initiate study material download
 * Checks both view AND download entitlements before allowing download
 */
export async function initiateStudyMaterialDownloadAction(materialId: string, materialIsPremium: boolean) {
  const session = await requireStudent()

  // Check view access first
  const viewAccess = await contentAccessService.canAccessStudyMaterial(session.user.id, materialIsPremium)
  if (!viewAccess.allowed) {
    throw new Error(viewAccess.reason || 'Access denied: Cannot view this material')
  }

  // Check download access
  const downloadAccess = await contentAccessService.canDownloadStudyMaterial(session.user.id, materialIsPremium)
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
