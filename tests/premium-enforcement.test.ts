import { beforeEach, describe, expect, it, vi } from 'vitest'

const subscriptionFindByUserId = vi.fn()

vi.mock('@/server/domains/billing/subscriptions/subscription.repository', () => ({
  subscriptionRepository: {
    findByUserId: subscriptionFindByUserId,
  },
}))

class ForbiddenError extends Error {
  constructor(message = 'Access denied.') {
    super(message)
    this.name = 'ForbiddenError'
    ;(this as any).status = 403
  }
}

const mockRequireStudent = vi.fn()
const mockRequireOwnership = vi.fn(() => undefined)

vi.mock('@/auth', () => ({
  requireStudent: mockRequireStudent,
  requireOwnership: mockRequireOwnership,
  ForbiddenError,
}))

const templateGetTemplate = vi.fn()
const attemptGenerateExamAttempt = vi.fn()

vi.mock('@/server/services/exam-template.service', () => ({
  getTemplate: templateGetTemplate,
}))

vi.mock('@/server/services/exam-attempt.service', () => ({
  generateExamAttempt: attemptGenerateExamAttempt,
}))

function activeSubscription(slug: string) {
  return {
    status: 'ACTIVE',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    gracePeriodEndsAt: null,
    subscriptionPlan: { slug },
  }
}

async function importRealServices() {
  const contentAccess = await import('@/server/services/content-access.service')
  const entitlements = await import('@/server/domains/billing/entitlements/entitlement.service')
  return {
    contentAccessService: contentAccess.contentAccessService,
    ContentAccessService: contentAccess.ContentAccessService,
    entitlementService: entitlements.entitlementService,
  }
}

describe('Premium Enforcement — exam-template entitlement path', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireOwnership.mockImplementation(() => undefined)
    mockRequireStudent.mockReset()
    mockRequireStudent.mockResolvedValue({ user: { id: 'student-123', role: 'STUDENT' } })
  })

  describe('contentAccessService.canAccessExamTemplate (real service chain)', () => {
    it('allows free exam templates without consulting entitlements', async () => {
      const { contentAccessService } = await importRealServices()

      const result = await contentAccessService.canAccessExamTemplate('student-123', false)

      expect(result.allowed).toBe(true)
      expect(result.requiredFeature).toBeUndefined()
      expect(subscriptionFindByUserId).not.toHaveBeenCalled()
    })

    it('maps module-tied premium templates to the premiumModules feature', async () => {
      const { contentAccessService, entitlementService } = await importRealServices()
      const premiumModulesSpy = vi.spyOn(entitlementService, 'canAccessPremiumModules')
      const unlimitedSpy = vi.spyOn(entitlementService, 'canAttemptUnlimitedMockExams')
      subscriptionFindByUserId.mockResolvedValue(activeSubscription('monthly'))

      const result = await contentAccessService.canAccessExamTemplate('student-123', true, 'module')

      expect(result.allowed).toBe(true)
      expect(result.requiredFeature).toBe('premiumModules')
      expect(premiumModulesSpy).toHaveBeenCalledWith('student-123')
      expect(unlimitedSpy).not.toHaveBeenCalled()
      premiumModulesSpy.mockRestore()
      unlimitedSpy.mockRestore()
    })

    it('maps standalone premium templates to the unlimitedMockExams feature', async () => {
      const { contentAccessService, entitlementService } = await importRealServices()
      const premiumModulesSpy = vi.spyOn(entitlementService, 'canAccessPremiumModules')
      const unlimitedSpy = vi.spyOn(entitlementService, 'canAttemptUnlimitedMockExams')
      subscriptionFindByUserId.mockResolvedValue(activeSubscription('monthly'))

      const result = await contentAccessService.canAccessExamTemplate('student-123', true, 'standalone')

      expect(result.allowed).toBe(true)
      expect(result.requiredFeature).toBe('unlimitedMockExams')
      expect(unlimitedSpy).toHaveBeenCalledWith('student-123')
      expect(premiumModulesSpy).not.toHaveBeenCalled()
      premiumModulesSpy.mockRestore()
      unlimitedSpy.mockRestore()
    })

    it('denies unsubscribed students from standalone premium templates', async () => {
      const { contentAccessService } = await importRealServices()
      subscriptionFindByUserId.mockResolvedValue(null)

      const result = await contentAccessService.canAccessExamTemplate('student-123', true, 'standalone')

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('Premium exam template access required (unlimitedMockExams)')
      expect(result.requiredFeature).toBe('unlimitedMockExams')
    })

    it('denies free-plan subscribers from module-tied premium templates', async () => {
      const { contentAccessService } = await importRealServices()
      subscriptionFindByUserId.mockResolvedValue(activeSubscription('free'))

      const result = await contentAccessService.canAccessExamTemplate('student-123', true, 'module')

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('Premium exam template access required (premiumModules)')
      expect(result.requiredFeature).toBe('premiumModules')
    })

    it('denies expired subscriptions from premium templates', async () => {
      const { contentAccessService } = await importRealServices()
      subscriptionFindByUserId.mockResolvedValue({
        status: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() - 24 * 60 * 60 * 1000),
        gracePeriodEndsAt: null,
        subscriptionPlan: { slug: 'yearly' },
      })

      const result = await contentAccessService.canAccessExamTemplate('student-123', true, 'module')

      expect(result.allowed).toBe(false)
      expect(result.requiredFeature).toBe('premiumModules')
    })
  })

  describe('generateAttempt action enforcement order (real action boundary)', () => {
    it('creates attempts for free templates without an entitlement check', async () => {
      const { generateAttempt } = await import('@/server/actions/exam.actions')

      templateGetTemplate.mockResolvedValue({ id: 'template-free', isPremium: false })
      attemptGenerateExamAttempt.mockResolvedValue({ id: 'attempt-free' })

      await expect(generateAttempt('template-free', 'student-123')).resolves.toEqual({
        id: 'attempt-free',
      })

      expect(subscriptionFindByUserId).not.toHaveBeenCalled()
      expect(attemptGenerateExamAttempt).toHaveBeenCalledWith('template-free', 'student-123')
    })

    it('blocks premium templates before creating an attempt', async () => {
      const { generateAttempt } = await import('@/server/actions/exam.actions')
      subscriptionFindByUserId.mockResolvedValue(null)

      templateGetTemplate.mockResolvedValue({
        id: 'template-premium',
        isPremium: true,
        moduleId: undefined,
      })

      await expect(generateAttempt('template-premium', 'student-123')).rejects.toThrow(
        'Premium exam template access required (unlimitedMockExams)'
      )

      expect(attemptGenerateExamAttempt).not.toHaveBeenCalled()
    })

    it('grants premium access to subscribed students and creates the attempt', async () => {
      const { generateAttempt } = await import('@/server/actions/exam.actions')
      subscriptionFindByUserId.mockResolvedValue(activeSubscription('monthly'))

      templateGetTemplate.mockResolvedValue({
        id: 'template-premium',
        isPremium: true,
        moduleId: 'module-1',
      })
      attemptGenerateExamAttempt.mockResolvedValue({ id: 'attempt-premium' })

      await expect(generateAttempt('template-premium', 'student-123')).resolves.toEqual({
        id: 'attempt-premium',
      })
      expect(attemptGenerateExamAttempt).toHaveBeenCalledWith('template-premium', 'student-123')
    })

    it('reports missing templates before any entitlement lookup', async () => {
      const { generateAttempt } = await import('@/server/actions/exam.actions')

      templateGetTemplate.mockResolvedValue(null)

      await expect(generateAttempt('missing-template', 'student-123')).rejects.toThrow(
        'Template not found.'
      )

      expect(subscriptionFindByUserId).not.toHaveBeenCalled()
      expect(attemptGenerateExamAttempt).not.toHaveBeenCalled()
    })

    it('enforces ownership before template retrieval', async () => {
      const { generateAttempt } = await import('@/server/actions/exam.actions')
      const callOrder: string[] = []

      mockRequireOwnership.mockImplementation(() => {
        callOrder.push('ownership')
        throw new ForbiddenError('Access denied.')
      })
      templateGetTemplate.mockImplementation(async () => {
        callOrder.push('template')
        return { id: 'template-free', isPremium: false }
      })

      await expect(generateAttempt('template-free', 'student-456')).rejects.toThrow(ForbiddenError)

      expect(callOrder).toEqual(['ownership'])
      expect(attemptGenerateExamAttempt).not.toHaveBeenCalled()
    })

    it('rejects unauthenticated students before any data access', async () => {
      const { generateAttempt } = await import('@/server/actions/exam.actions')

      mockRequireStudent.mockRejectedValue(new Error('Authentication required.'))

      await expect(generateAttempt('template-free', 'student-123')).rejects.toThrow(
        'Authentication required.'
      )

      expect(templateGetTemplate).not.toHaveBeenCalled()
      expect(subscriptionFindByUserId).not.toHaveBeenCalled()
      expect(attemptGenerateExamAttempt).not.toHaveBeenCalled()
    })
  })
})
