import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireStudent: vi.fn(),
  findQuestionBankById: vi.fn(),
  findQuestionById: vi.fn(),
  canAccessQuestionBank: vi.fn(),
  canAccessQuestion: vi.fn(),
  canDownloadStudyMaterial: vi.fn(),
  getStudentStudyMaterialAccess: vi.fn(),
}))

vi.mock('@/auth', () => ({ requireStudent: mocks.requireStudent }))
vi.mock('@/server/repositories/question-bank.repository', () => ({
  questionBankRepository: { findById: mocks.findQuestionBankById },
}))
vi.mock('@/server/repositories/question.repository', () => ({
  questionRepository: { findById: mocks.findQuestionById },
}))
vi.mock('@/server/services/content-access.service', () => ({
  contentAccessService: {
    canAccessQuestionBank: mocks.canAccessQuestionBank,
    canAccessQuestion: mocks.canAccessQuestion,
    canDownloadStudyMaterial: mocks.canDownloadStudyMaterial,
  },
}))
vi.mock('@/server/services/resource.service', () => ({
  getStudentStudyMaterialAccess: mocks.getStudentStudyMaterialAccess,
}))

describe('student content access actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireStudent.mockResolvedValue({ user: { id: 'student-1', role: 'STUDENT' } })
    mocks.findQuestionBankById.mockResolvedValue({
      id: 'bank-1', status: 'PUBLISHED', deletedAt: null, isPremium: true,
    })
    mocks.findQuestionById.mockResolvedValue({
      id: 'question-1', questionBankId: 'bank-1', status: 'PUBLISHED', deletedAt: null,
    })
    mocks.canAccessQuestionBank.mockResolvedValue({ allowed: true })
    mocks.canAccessQuestion.mockResolvedValue({ allowed: true })
    mocks.canDownloadStudyMaterial.mockResolvedValue({ allowed: true })
    mocks.getStudentStudyMaterialAccess.mockResolvedValue({
      resource: { id: 'material-1', isPremium: false },
      premiumRequired: false,
      allowed: true,
    })
  })

  it('uses persisted question-bank premium state instead of a client boolean', async () => {
    const { canAccessQuestionBankAction } = await import('@/server/actions/student-content-access.actions')

    await expect(canAccessQuestionBankAction('bank-1', false)).resolves.toEqual({ allowed: true })
    expect(mocks.canAccessQuestionBank).toHaveBeenCalledWith('student-1', true)
  })

  it('denies unpublished or deleted question banks', async () => {
    mocks.findQuestionBankById.mockResolvedValueOnce({
      id: 'bank-1', status: 'DRAFT', deletedAt: null, isPremium: false,
    })
    const { canAccessQuestionBankAction } = await import('@/server/actions/student-content-access.actions')

    await expect(canAccessQuestionBankAction('bank-1')).resolves.toMatchObject({ allowed: false })
    expect(mocks.canAccessQuestionBank).not.toHaveBeenCalled()
  })

  it('denies questions that are unpublished, deleted, or bound to another bank', async () => {
    const { canAccessQuestionAction } = await import('@/server/actions/student-content-access.actions')
    mocks.findQuestionById.mockResolvedValueOnce({
      id: 'question-1', questionBankId: 'other-bank', status: 'PUBLISHED', deletedAt: null,
    })

    await expect(canAccessQuestionAction('bank-1', 'question-1')).resolves.toMatchObject({ allowed: false })
    expect(mocks.findQuestionBankById).not.toHaveBeenCalled()
    expect(mocks.canAccessQuestion).not.toHaveBeenCalled()
  })

  it('loads material access by ID for view checks and fails closed when missing', async () => {
    const { canAccessStudyMaterialAction } = await import('@/server/actions/student-content-access.actions')
    mocks.getStudentStudyMaterialAccess.mockResolvedValueOnce(null)

    await expect(canAccessStudyMaterialAction('material-404')).resolves.toMatchObject({ allowed: false })
    expect(mocks.getStudentStudyMaterialAccess).toHaveBeenCalledWith('student-1', 'material-404')
  })

  it('uses persisted effective premium state for downloads', async () => {
    const { canDownloadStudyMaterialAction, initiateStudyMaterialDownloadAction } = await import('@/server/actions/student-content-access.actions')
    mocks.getStudentStudyMaterialAccess.mockResolvedValue({
      resource: { id: 'material-1', isPremium: false },
      premiumRequired: true,
      allowed: true,
    })

    await expect(canDownloadStudyMaterialAction('material-1')).resolves.toEqual({ allowed: true })
    expect(mocks.canDownloadStudyMaterial).toHaveBeenCalledWith('student-1', true)

    await expect(initiateStudyMaterialDownloadAction('material-1')).resolves.toMatchObject({
      allowed: true, materialId: 'material-1', userId: 'student-1',
    })
    expect(mocks.getStudentStudyMaterialAccess).toHaveBeenCalledWith('student-1', 'material-1')
  })
})
