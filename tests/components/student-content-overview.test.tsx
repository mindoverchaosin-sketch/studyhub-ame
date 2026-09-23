import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireStudent = vi.fn()
const requirePermission = vi.fn()
const listStudentExamTemplates = vi.fn()
const listExamTemplates = vi.fn()

vi.mock('@/server/actions/exam.actions', () => ({
  listStudentExamTemplates,
  listExamTemplates,
}))
vi.mock('@/auth', () => ({ requireStudent, requirePermission }))
vi.mock('@/server/services/course.service', () => ({ getAllCourses: vi.fn().mockResolvedValue([]) }))
vi.mock('@/server/services/module.service', () => ({ getModulesByCourse: vi.fn().mockResolvedValue([]) }))
vi.mock('@/server/services/student-question-bank.service', () => ({ getStudentQuestionBanks: vi.fn().mockResolvedValue([]) }))
vi.mock('@/server/domains/billing/entitlements/entitlement.service', () => ({
  entitlementService: {
    canAccessPremiumModules: vi.fn().mockResolvedValue(false),
    canUseAITutor: vi.fn().mockResolvedValue(false),
  },
}))

describe('StudentContentOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireStudent.mockResolvedValue({ user: { id: 'student-1', role: 'STUDENT' } })
    listStudentExamTemplates.mockResolvedValue([])
  })

  it('loads exam templates through the student-safe path without manageModules', async () => {
    const { default: StudentContentOverview } = await import('@/components/dashboard/StudentContentOverview')

    await StudentContentOverview({ userId: 'student-1' })

    expect(listStudentExamTemplates).toHaveBeenCalledWith({ pageSize: 100 })
    expect(listExamTemplates).not.toHaveBeenCalled()
    expect(requirePermission).not.toHaveBeenCalledWith('manageModules')
  })
})
