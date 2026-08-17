/**
 * Content Access Service Tests
 *
 * Validates:
 * - Free content access (always allowed)
 * - Premium content without entitlement (denied)
 * - Premium content with entitlement (allowed)
 * - Inherited access (Lesson from Module, Question from QB)
 * - AI Tutor entitlement
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { contentAccessService } from '@/server/services/content-access.service'
import { entitlementService } from '@/server/domains/billing/entitlements/entitlement.service'

// Mock the entitlement service
vi.mock('@/server/domains/billing/entitlements/entitlement.service', () => ({
  entitlementService: {
    canAccessPremiumModules: vi.fn(),
    canDownloadResources: vi.fn(),
    canAttemptUnlimitedMockExams: vi.fn(),
    canAccessAnalytics: vi.fn(),
    canUseAITutor: vi.fn(),
  },
}))

const TEST_USER_ID = 'test-user-123'

describe('ContentAccessService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===== COURSE TESTS =====
  describe('canAccessCourse', () => {
    it('should allow free course to all authenticated students', async () => {
      const result = await contentAccessService.canAccessCourse(TEST_USER_ID, false)
      expect(result.allowed).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should allow premium course if student has premiumModules feature', async () => {
      vi.mocked(entitlementService.canAccessPremiumModules).mockResolvedValue(true)

      const result = await contentAccessService.canAccessCourse(TEST_USER_ID, true)
      expect(result.allowed).toBe(true)
      expect(result.requiredFeature).toBe('premiumModules')
      expect(entitlementService.canAccessPremiumModules).toHaveBeenCalledWith(TEST_USER_ID)
    })

    it('should deny premium course if student lacks premiumModules feature', async () => {
      vi.mocked(entitlementService.canAccessPremiumModules).mockResolvedValue(false)

      const result = await contentAccessService.canAccessCourse(TEST_USER_ID, true)
      expect(result.allowed).toBe(false)
      expect(result.reason).toBeDefined()
      expect(result.reason).toContain('Premium course')
    })
  })

  // ===== MODULE TESTS =====
  describe('canAccessModule', () => {
    it('should allow free module to all students', async () => {
      const result = await contentAccessService.canAccessModule(TEST_USER_ID, false)
      expect(result.allowed).toBe(true)
    })

    it('should allow premium module with entitlement', async () => {
      vi.mocked(entitlementService.canAccessPremiumModules).mockResolvedValue(true)

      const result = await contentAccessService.canAccessModule(TEST_USER_ID, true)
      expect(result.allowed).toBe(true)
      expect(result.requiredFeature).toBe('premiumModules')
    })

    it('should deny premium module without entitlement', async () => {
      vi.mocked(entitlementService.canAccessPremiumModules).mockResolvedValue(false)

      const result = await contentAccessService.canAccessModule(TEST_USER_ID, true)
      expect(result.allowed).toBe(false)
    })
  })

  // ===== LESSON TESTS (INHERITED ACCESS) =====
  describe('canAccessLesson', () => {
    it('should inherit access from free parent module', async () => {
      const result = await contentAccessService.canAccessLesson(TEST_USER_ID, false)
      expect(result.allowed).toBe(true)
    })

    it('should inherit access from premium parent module with entitlement', async () => {
      vi.mocked(entitlementService.canAccessPremiumModules).mockResolvedValue(true)

      const result = await contentAccessService.canAccessLesson(TEST_USER_ID, true)
      expect(result.allowed).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should be denied if parent module is premium without entitlement', async () => {
      vi.mocked(entitlementService.canAccessPremiumModules).mockResolvedValue(false)

      const result = await contentAccessService.canAccessLesson(TEST_USER_ID, true)
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Parent module')
    })
  })

  // ===== QUIZ TESTS (INHERITED ACCESS) =====
  describe('canAccessQuiz', () => {
    it('should inherit access from free parent module', async () => {
      const result = await contentAccessService.canAccessQuiz(TEST_USER_ID, false)
      expect(result.allowed).toBe(true)
    })

    it('should inherit access from premium parent module with entitlement', async () => {
      vi.mocked(entitlementService.canAccessPremiumModules).mockResolvedValue(true)

      const result = await contentAccessService.canAccessQuiz(TEST_USER_ID, true)
      expect(result.allowed).toBe(true)
    })

    it('should be denied if parent module is premium without entitlement', async () => {
      vi.mocked(entitlementService.canAccessPremiumModules).mockResolvedValue(false)

      const result = await contentAccessService.canAccessQuiz(TEST_USER_ID, true)
      expect(result.allowed).toBe(false)
    })
  })

  // ===== STUDY MATERIAL (RESOURCES) TESTS - VIEW ACCESS =====
  describe('canAccessStudyMaterial', () => {
    it('should allow free study material to all students', async () => {
      const result = await contentAccessService.canAccessStudyMaterial(TEST_USER_ID, false)
      expect(result.allowed).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should allow premium material VIEW with premiumModules feature', async () => {
      vi.mocked(entitlementService.canAccessPremiumModules).mockResolvedValue(true)

      const result = await contentAccessService.canAccessStudyMaterial(TEST_USER_ID, true)
      expect(result.allowed).toBe(true)
      expect(result.requiredFeature).toBe('premiumModules')
      expect(entitlementService.canAccessPremiumModules).toHaveBeenCalledWith(TEST_USER_ID)
      // Ensure download service is NOT called for view access
      expect(entitlementService.canDownloadResources).not.toHaveBeenCalled()
    })

    it('should deny premium material VIEW without premiumModules feature', async () => {
      vi.mocked(entitlementService.canAccessPremiumModules).mockResolvedValue(false)

      const result = await contentAccessService.canAccessStudyMaterial(TEST_USER_ID, true)
      expect(result.allowed).toBe(false)
      expect(result.reason).toBeDefined()
      expect(result.requiredFeature).toBe('premiumModules')
    })
  })

  // ===== STUDY MATERIAL (RESOURCES) TESTS - DOWNLOAD ACCESS =====
  describe('canDownloadStudyMaterial', () => {
    it('should allow free material download regardless of subscription', async () => {
      const result = await contentAccessService.canDownloadStudyMaterial(TEST_USER_ID, false)
      expect(result.allowed).toBe(true)
      expect(result.reason).toBeUndefined()
      // Should not check any entitlements for free materials
      expect(entitlementService.canDownloadResources).not.toHaveBeenCalled()
    })

    it('should allow premium material DOWNLOAD with downloadResources feature', async () => {
      vi.mocked(entitlementService.canDownloadResources).mockResolvedValue(true)

      const result = await contentAccessService.canDownloadStudyMaterial(TEST_USER_ID, true)
      expect(result.allowed).toBe(true)
      expect(result.requiredFeature).toBe('downloadResources')
      expect(entitlementService.canDownloadResources).toHaveBeenCalledWith(TEST_USER_ID)
      // Ensure view check is NOT called for download permission
      expect(entitlementService.canAccessPremiumModules).not.toHaveBeenCalled()
    })

    it('should deny premium material DOWNLOAD without downloadResources feature', async () => {
      vi.mocked(entitlementService.canDownloadResources).mockResolvedValue(false)

      const result = await contentAccessService.canDownloadStudyMaterial(TEST_USER_ID, true)
      expect(result.allowed).toBe(false)
      expect(result.reason).toBeDefined()
      expect(result.requiredFeature).toBe('downloadResources')
    })

    it('VIEW access must not depend on downloadResources', async () => {
      // User can VIEW premium material with premiumModules
      vi.mocked(entitlementService.canAccessPremiumModules).mockResolvedValue(true)
      vi.mocked(entitlementService.canDownloadResources).mockResolvedValue(false)

      const viewResult = await contentAccessService.canAccessStudyMaterial(TEST_USER_ID, true)
      expect(viewResult.allowed).toBe(true)
      expect(viewResult.requiredFeature).toBe('premiumModules')
    })

    it('DOWNLOAD access must not depend on premiumModules alone', async () => {
      // User has premiumModules but not downloadResources
      vi.mocked(entitlementService.canAccessPremiumModules).mockResolvedValue(true)
      vi.mocked(entitlementService.canDownloadResources).mockResolvedValue(false)

      const downloadResult = await contentAccessService.canDownloadStudyMaterial(TEST_USER_ID, true)
      expect(downloadResult.allowed).toBe(false)
      expect(downloadResult.requiredFeature).toBe('downloadResources')
    })
  })

  // ===== MOCK TEST TESTS =====
  describe('canAccessMockTest', () => {
    it('should allow free mock test', async () => {
      const result = await contentAccessService.canAccessMockTest(TEST_USER_ID, false)
      expect(result.allowed).toBe(true)
    })

    it('should allow premium mock test with unlimitedMockExams feature', async () => {
      vi.mocked(entitlementService.canAttemptUnlimitedMockExams).mockResolvedValue(true)

      const result = await contentAccessService.canAccessMockTest(TEST_USER_ID, true)
      expect(result.allowed).toBe(true)
      expect(result.requiredFeature).toBe('unlimitedMockExams')
      expect(entitlementService.canAttemptUnlimitedMockExams).toHaveBeenCalledWith(TEST_USER_ID)
    })

    it('should deny premium mock test without unlimitedMockExams feature', async () => {
      vi.mocked(entitlementService.canAttemptUnlimitedMockExams).mockResolvedValue(false)

      const result = await contentAccessService.canAccessMockTest(TEST_USER_ID, true)
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Premium mock test')
    })
  })

  // ===== QUESTION BANK TESTS =====
  describe('canAccessQuestionBank', () => {
    it('should allow free question bank', async () => {
      const result = await contentAccessService.canAccessQuestionBank(TEST_USER_ID, false)
      expect(result.allowed).toBe(true)
    })

    it('should allow premium question bank with premiumModules feature', async () => {
      vi.mocked(entitlementService.canAccessPremiumModules).mockResolvedValue(true)

      const result = await contentAccessService.canAccessQuestionBank(TEST_USER_ID, true)
      expect(result.allowed).toBe(true)
      expect(result.requiredFeature).toBe('premiumModules')
    })

    it('should deny premium question bank without premiumModules feature', async () => {
      vi.mocked(entitlementService.canAccessPremiumModules).mockResolvedValue(false)

      const result = await contentAccessService.canAccessQuestionBank(TEST_USER_ID, true)
      expect(result.allowed).toBe(false)
    })
  })

  // ===== QUESTION TESTS (INHERITED ACCESS) =====
  describe('canAccessQuestion', () => {
    it('should inherit access from free parent question bank', async () => {
      const result = await contentAccessService.canAccessQuestion(TEST_USER_ID, false)
      expect(result.allowed).toBe(true)
    })

    it('should inherit access from premium QB with entitlement', async () => {
      vi.mocked(entitlementService.canAccessPremiumModules).mockResolvedValue(true)

      const result = await contentAccessService.canAccessQuestion(TEST_USER_ID, true)
      expect(result.allowed).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should be denied if parent QB is premium without entitlement', async () => {
      vi.mocked(entitlementService.canAccessPremiumModules).mockResolvedValue(false)

      const result = await contentAccessService.canAccessQuestion(TEST_USER_ID, true)
      expect(result.allowed).toBe(false)
    })
  })

  // ===== EXAM TEMPLATE TESTS =====
  describe('canAccessExamTemplate', () => {
    it('should allow free exam template', async () => {
      const result = await contentAccessService.canAccessExamTemplate(TEST_USER_ID, false)
      expect(result.allowed).toBe(true)
    })

    it('should use premiumModules for module-context exam template', async () => {
      vi.mocked(entitlementService.canAccessPremiumModules).mockResolvedValue(true)

      const result = await contentAccessService.canAccessExamTemplate(TEST_USER_ID, true, 'module')
      expect(result.allowed).toBe(true)
      expect(result.requiredFeature).toBe('premiumModules')
      expect(entitlementService.canAccessPremiumModules).toHaveBeenCalled()
    })

    it('should use unlimitedMockExams for standalone exam template', async () => {
      vi.mocked(entitlementService.canAttemptUnlimitedMockExams).mockResolvedValue(true)

      const result = await contentAccessService.canAccessExamTemplate(TEST_USER_ID, true, 'standalone')
      expect(result.allowed).toBe(true)
      expect(result.requiredFeature).toBe('unlimitedMockExams')
      expect(entitlementService.canAttemptUnlimitedMockExams).toHaveBeenCalled()
    })

    it('should default to premiumModules when context not specified', async () => {
      vi.mocked(entitlementService.canAccessPremiumModules).mockResolvedValue(false)

      const result = await contentAccessService.canAccessExamTemplate(TEST_USER_ID, true)
      expect(entitlementService.canAccessPremiumModules).toHaveBeenCalled()
    })

    it('should deny premium template without appropriate feature', async () => {
      vi.mocked(entitlementService.canAccessPremiumModules).mockResolvedValue(false)

      const result = await contentAccessService.canAccessExamTemplate(TEST_USER_ID, true, 'module')
      expect(result.allowed).toBe(false)
    })
  })

  // ===== AI TUTOR TESTS =====
  describe('canUseAITutor', () => {
    it('should check aiTools feature for AI Tutor access', async () => {
      vi.mocked(entitlementService.canUseAITutor).mockResolvedValue(true)

      const result = await contentAccessService.canUseAITutor(TEST_USER_ID)
      expect(result.allowed).toBe(true)
      expect(result.requiredFeature).toBe('aiTools')
      expect(entitlementService.canUseAITutor).toHaveBeenCalledWith(TEST_USER_ID)
    })

    it('should deny AI Tutor without aiTools feature', async () => {
      vi.mocked(entitlementService.canUseAITutor).mockResolvedValue(false)

      const result = await contentAccessService.canUseAITutor(TEST_USER_ID)
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('AI Tutor')
    })
  })

  // ===== HELPER TESTS =====
  describe('throwIfDenied', () => {
    it('should throw error if access is denied', () => {
      const deniedResult = { allowed: false, reason: 'No access' }
      expect(() => contentAccessService.throwIfDenied(deniedResult, 'test-context')).toThrow(
        'No access'
      )
    })

    it('should not throw if access is allowed', () => {
      const allowedResult = { allowed: true }
      expect(() => contentAccessService.throwIfDenied(allowedResult, 'test-context')).not.toThrow()
    })

    it('should use custom context in default message', () => {
      const deniedResult = { allowed: false }
      expect(() => contentAccessService.throwIfDenied(deniedResult, 'custom-context')).toThrow(
        /custom-context/
      )
    })
  })

  // ===== CROSS-ENTITY SCENARIO TESTS =====
  describe('Real-world scenarios', () => {
    it('Premium course → premium module → free lesson should deny if no entitlement', async () => {
      vi.mocked(entitlementService.canAccessPremiumModules).mockResolvedValue(false)

      // Course check
      const courseResult = await contentAccessService.canAccessCourse(TEST_USER_ID, true)
      expect(courseResult.allowed).toBe(false)

      // Module check
      const moduleResult = await contentAccessService.canAccessModule(TEST_USER_ID, true)
      expect(moduleResult.allowed).toBe(false)

      // Lesson would inherit module's premium status
      const lessonResult = await contentAccessService.canAccessLesson(TEST_USER_ID, true)
      expect(lessonResult.allowed).toBe(false)
    })

    it('Free course → premium module → should grant access with entitlement', async () => {
      vi.mocked(entitlementService.canAccessPremiumModules).mockResolvedValue(true)

      // Free course always ok
      const courseResult = await contentAccessService.canAccessCourse(TEST_USER_ID, false)
      expect(courseResult.allowed).toBe(true)

      // Premium module with entitlement
      const moduleResult = await contentAccessService.canAccessModule(TEST_USER_ID, true)
      expect(moduleResult.allowed).toBe(true)

      // Quiz inherits access
      const quizResult = await contentAccessService.canAccessQuiz(TEST_USER_ID, true)
      expect(quizResult.allowed).toBe(true)
    })

    it('Premium QB → questions should inherit access correctly', async () => {
      vi.mocked(entitlementService.canAccessPremiumModules).mockResolvedValue(true)

      // Check QB
      const qbResult = await contentAccessService.canAccessQuestionBank(TEST_USER_ID, true)
      expect(qbResult.allowed).toBe(true)

      // Questions inherit QB's premium status
      const q1Result = await contentAccessService.canAccessQuestion(TEST_USER_ID, true)
      expect(q1Result.allowed).toBe(true)

      const q2Result = await contentAccessService.canAccessQuestion(TEST_USER_ID, true)
      expect(q2Result.allowed).toBe(true)
    })

    it('Multiple premium resources with different features', async () => {
      vi.mocked(entitlementService.canAccessPremiumModules).mockResolvedValue(true)
      vi.mocked(entitlementService.canDownloadResources).mockResolvedValue(false)
      vi.mocked(entitlementService.canAttemptUnlimitedMockExams).mockResolvedValue(true)

      // Premium module - should pass (uses premiumModules)
      const moduleResult = await contentAccessService.canAccessModule(TEST_USER_ID, true)
      expect(moduleResult.allowed).toBe(true)
      expect(moduleResult.requiredFeature).toBe('premiumModules')

      // Premium study material VIEW - should pass (now uses premiumModules)
      const materialViewResult = await contentAccessService.canAccessStudyMaterial(TEST_USER_ID, true)
      expect(materialViewResult.allowed).toBe(true)
      expect(materialViewResult.requiredFeature).toBe('premiumModules')

      // Premium study material DOWNLOAD - should fail (requires downloadResources)
      const materialDownloadResult = await contentAccessService.canDownloadStudyMaterial(TEST_USER_ID, true)
      expect(materialDownloadResult.allowed).toBe(false)
      expect(materialDownloadResult.requiredFeature).toBe('downloadResources')

      // Premium mock test - should pass (uses unlimitedMockExams)
      const mockResult = await contentAccessService.canAccessMockTest(TEST_USER_ID, true)
      expect(mockResult.allowed).toBe(true)
      expect(mockResult.requiredFeature).toBe('unlimitedMockExams')
    })
  })
})
