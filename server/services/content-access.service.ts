/**
 * Content Access Service
 *
 * Canonical server-side access control for all student learning content.
 * Answers: Is this content FREE or PREMIUM? Does this student have access?
 *
 * Supports:
 * - Course, Module, Lesson, Quiz (hierarchy: Module→Lesson/Quiz inherit)
 * - StudyMaterial (resources with isPremium flag)
 * - MockTest (standalone premium flag)
 * - QuestionBank, Question (hierarchy: QB→Questions inherit)
 * - ExamTemplate (exam definitions)
 * - AI Tutor (feature-based entitlement)
 */

import { entitlementService } from '@/server/domains/billing/entitlements/entitlement.service'
import type { FeatureName } from '@/server/domains/billing/dto/billing.dto'

/**
 * Content access result
 */
export interface ContentAccessResult {
  allowed: boolean
  reason?: string
  requiredFeature?: FeatureName
}

/**
 * Content Access Service
 */
export class ContentAccessService {
  /**
   * Check if a student can access a course
   *
   * Course access is premium if course.isPremium = true
   */
  async canAccessCourse(
    userId: string,
    courseIsPremium: boolean
  ): Promise<ContentAccessResult> {
    if (!courseIsPremium) {
      return { allowed: true }
    }

    const canAccess = await entitlementService.canAccessPremiumModules(userId)
    return {
      allowed: canAccess,
      reason: canAccess ? undefined : 'Premium course access required',
      requiredFeature: 'premiumModules',
    }
  }

  /**
   * Check if a student can access a module
   *
   * Module access is premium if module.isPremium = true
   */
  async canAccessModule(
    userId: string,
    moduleIsPremium: boolean
  ): Promise<ContentAccessResult> {
    if (!moduleIsPremium) {
      return { allowed: true }
    }

    const canAccess = await entitlementService.canAccessPremiumModules(userId)
    return {
      allowed: canAccess,
      reason: canAccess ? undefined : 'Premium module access required',
      requiredFeature: 'premiumModules',
    }
  }

  /**
   * Check if a student can access a lesson
   *
   * Lessons inherit access from their parent module.
   * Pass the module's isPremium flag.
   */
  async canAccessLesson(
    userId: string,
    moduleIsPremium: boolean
  ): Promise<ContentAccessResult> {
    if (!moduleIsPremium) {
      return { allowed: true }
    }

    const canAccess = await entitlementService.canAccessPremiumModules(userId)
    return {
      allowed: canAccess,
      reason: canAccess ? undefined : 'Parent module requires premium access',
      requiredFeature: 'premiumModules',
    }
  }

  /**
   * Check if a student can access a quiz
   *
   * Quizzes inherit access from their parent module.
   * Pass the module's isPremium flag.
   */
  async canAccessQuiz(
    userId: string,
    moduleIsPremium: boolean
  ): Promise<ContentAccessResult> {
    if (!moduleIsPremium) {
      return { allowed: true }
    }

    const canAccess = await entitlementService.canAccessPremiumModules(userId)
    return {
      allowed: canAccess,
      reason: canAccess ? undefined : 'Parent module requires premium access',
      requiredFeature: 'premiumModules',
    }
  }

  /**
   * Check if a student can VIEW a study material (resource)
   *
   * StudyMaterial has isPremium field.
   * Viewing premium materials requires premiumModules feature
   * (same as accessing lessons/quizzes in premium modules).
   *
   * Note: This is VIEW access only. Download access is separate.
   */
  async canAccessStudyMaterial(
    userId: string,
    materialIsPremium: boolean
  ): Promise<ContentAccessResult> {
    if (!materialIsPremium) {
      return { allowed: true }
    }

    const canAccess = await entitlementService.canAccessPremiumModules(userId)
    return {
      allowed: canAccess,
      reason: canAccess ? undefined : 'Premium module access required to view this material',
      requiredFeature: 'premiumModules',
    }
  }

  /**
   * Check if a student can DOWNLOAD a study material (resource)
   *
   * StudyMaterial download permission is separate from viewing.
   * Requires downloadResources feature if material is premium.
   *
   * Free materials can be downloaded if user has no subscription.
   * Premium materials require downloadResources entitlement.
   */
  async canDownloadStudyMaterial(
    userId: string,
    materialIsPremium: boolean
  ): Promise<ContentAccessResult> {
    if (!materialIsPremium) {
      return { allowed: true }
    }

    const canAccess = await entitlementService.canDownloadResources(userId)
    return {
      allowed: canAccess,
      reason: canAccess ? undefined : 'Premium download access required',
      requiredFeature: 'downloadResources',
    }
  }

  /**
   * Check if a student can access a mock test
   *
   * MockTest has isPremium field.
   * Requires unlimitedMockExams feature if premium.
   */
  async canAccessMockTest(
    userId: string,
    mockTestIsPremium: boolean
  ): Promise<ContentAccessResult> {
    if (!mockTestIsPremium) {
      return { allowed: true }
    }

    const canAccess = await entitlementService.canAttemptUnlimitedMockExams(userId)
    return {
      allowed: canAccess,
      reason: canAccess ? undefined : 'Premium mock test access required',
      requiredFeature: 'unlimitedMockExams',
    }
  }

  /**
   * Check if a student can access a question bank
   *
   * QuestionBank has isPremium field.
   * Access depends on context (module quiz vs standalone).
   * For now, uses premiumModules feature (can be refined later).
   */
  async canAccessQuestionBank(
    userId: string,
    questionBankIsPremium: boolean
  ): Promise<ContentAccessResult> {
    if (!questionBankIsPremium) {
      return { allowed: true }
    }

    const canAccess = await entitlementService.canAccessPremiumModules(userId)
    return {
      allowed: canAccess,
      reason: canAccess ? undefined : 'Premium question bank access required',
      requiredFeature: 'premiumModules',
    }
  }

  /**
   * Check if a student can access a question
   *
   * Questions inherit access from their parent question bank.
   * Pass the QB's isPremium flag.
   */
  async canAccessQuestion(
    userId: string,
    questionBankIsPremium: boolean
  ): Promise<ContentAccessResult> {
    if (!questionBankIsPremium) {
      return { allowed: true }
    }

    const canAccess = await entitlementService.canAccessPremiumModules(userId)
    return {
      allowed: canAccess,
      reason: canAccess ? undefined : 'Parent question bank requires premium access',
      requiredFeature: 'premiumModules',
    }
  }

  /**
   * Check if a student can access an exam template
   *
   * ExamTemplate has isPremium field.
   * Access depends on context (module-based vs standalone).
   * For module-based: uses premiumModules feature
   * For standalone: uses unlimitedMockExams feature
   *
   * For simplicity in Phase 6A, defaults to premiumModules.
   */
  async canAccessExamTemplate(
    userId: string,
    examTemplateIsPremium: boolean,
    context?: 'module' | 'standalone'
  ): Promise<ContentAccessResult> {
    if (!examTemplateIsPremium) {
      return { allowed: true }
    }

    const feature = context === 'standalone' ? 'unlimitedMockExams' : 'premiumModules'
    let canAccess: boolean

    if (feature === 'premiumModules') {
      canAccess = await entitlementService.canAccessPremiumModules(userId)
    } else {
      canAccess = await entitlementService.canAttemptUnlimitedMockExams(userId)
    }

    return {
      allowed: canAccess,
      reason: canAccess ? undefined : `Premium exam template access required (${feature})`,
      requiredFeature: feature,
    }
  }

  /**
   * Check if a student can use AI Tutor
   *
   * AI Tutor is a feature-based entitlement.
   * Requires aiTools feature in subscription plan.
   */
  async canUseAITutor(userId: string): Promise<ContentAccessResult> {
    const canAccess = await entitlementService.canUseAITutor(userId)
    return {
      allowed: canAccess,
      reason: canAccess ? undefined : 'AI Tutor access requires premium subscription',
      requiredFeature: 'aiTools',
    }
  }

  /**
   * Helper: Throw error if access denied
   *
   * Throws descriptive error with reason and required feature.
   */
  throwIfDenied(result: ContentAccessResult, context: string): void {
    if (!result.allowed) {
      const message = result.reason || `Access denied: ${context}`
      throw new Error(message)
    }
  }
}

export const contentAccessService = new ContentAccessService()
