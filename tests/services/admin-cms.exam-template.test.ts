import { beforeEach, describe, expect, it, vi } from 'vitest'

type TemplateRecord = {
  id: string
  name: string
  description: string | null
  questionBankId: string | null
  moduleId: string | null
  courseId: string | null
  durationMinutes: number
  questionCount: number
  passingPercentage: number
  shuffleQuestions: boolean
  shuffleAnswers: boolean
  negativeMarkingEnabled: boolean
  active: boolean
  isPremium: boolean
  createdAt: Date
  updatedAt: Date
}

function makeTemplate(overrides: Partial<TemplateRecord> = {}): TemplateRecord {
  const timestamp = new Date('2026-01-01T00:00:00.000Z')
  return {
    id: 'template-1',
    name: 'Premium Mock',
    description: null,
    questionBankId: null,
    moduleId: null,
    courseId: null,
    durationMinutes: 60,
    questionCount: 20,
    passingPercentage: 70,
    shuffleQuestions: true,
    shuffleAnswers: false,
    negativeMarkingEnabled: false,
    active: true,
    isPremium: true,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  }
}

function mockAdminCms(template = makeTemplate()) {
  const examTemplateRepository = {
    listTemplates: vi.fn(async () => [template]),
    countTemplates: vi.fn(async () => 1),
    getTemplate: vi.fn(async () => template),
    countAttemptsForTemplate: vi.fn(async () => 0),
    createTemplate: vi.fn(async (data: Partial<TemplateRecord>) => ({ ...template, ...data, id: 'template-created' })),
    updateTemplate: vi.fn(async (id: string, data: Partial<TemplateRecord>) => ({ ...template, ...data, id })),
    deleteTemplate: vi.fn(async () => template),
    activateTemplate: vi.fn(async (id: string, active: boolean) => ({ ...template, id, active })),
  }
  const mockTestRepository = {
    list: vi.fn(),
    count: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    duplicate: vi.fn(),
    setPublishState: vi.fn(),
  }
  const auditRepository = { recordEvent: vi.fn(async () => undefined) }
  const moduleRepository = {
    findById: vi.fn(async (id: string) => ({ id, title: 'Digital Techniques', deletedAt: null })),
  }

  vi.doMock('@/server/repositories/exam-template.repository', () => ({ examTemplateRepository }))
  vi.doMock('@/server/repositories/mock-test.repository', () => ({ mockTestRepository }))
  vi.doMock('@/server/repositories/audit.repository', () => ({ auditRepository }))
  vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository }))

  return { examTemplateRepository, mockTestRepository, auditRepository, moduleRepository }
}

describe('admin CMS exam-template ownership', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('lists and persists exam settings through ExamTemplate, not MockTest', async () => {
    const { examTemplateRepository, mockTestRepository, auditRepository } = mockAdminCms()
    const service = await import('@/server/services/admin-cms.service')

    const listed = await service.listMockTests({ search: 'Premium', courseId: 'course-1', page: 2, pageSize: 5, sortBy: 'title' })
    expect(examTemplateRepository.listTemplates).toHaveBeenCalledWith({ search: 'Premium', courseId: 'course-1', sortBy: 'title', skip: 5, take: 5 })
    expect(listed.success && listed.data.items[0]).toMatchObject({
      id: 'template-1',
      title: 'Premium Mock',
      durationMinutes: 60,
      passingPercentage: 70,
      questionCount: 20,
      randomized: true,
      status: 'Published',
      isPremium: true,
    })

    const created = await service.createMockTest({
      title: 'New exam',
      moduleId: 'module-1',
      durationMinutes: 45,
      passingPercentage: 65,
      questionCount: 15,
      randomized: false,
      status: 'Published',
      isPremium: true,
    }, 'admin-1')
    expect(created.success).toBe(true)
    expect(examTemplateRepository.createTemplate).toHaveBeenCalledWith(expect.objectContaining({
      name: 'New exam',
      durationMinutes: 45,
      passingPercentage: 65,
      questionCount: 15,
      shuffleQuestions: false,
      active: true,
      isPremium: true,
      moduleId: 'module-1',
    }))

    const updated = await service.updateMockTest('template-1', {
      durationMinutes: 75,
      passingPercentage: 80,
      questionCount: 30,
      randomized: true,
      status: 'Draft',
      isPremium: false,
    }, 'admin-1')
    expect(updated.success).toBe(true)
    expect(examTemplateRepository.updateTemplate).toHaveBeenCalledWith('template-1', expect.objectContaining({
      durationMinutes: 75,
      passingPercentage: 80,
      questionCount: 30,
      shuffleQuestions: true,
      active: false,
      isPremium: false,
    }))
    expect(auditRepository.recordEvent).toHaveBeenCalledWith(expect.objectContaining({ targetType: 'EXAM_TEMPLATE' }))
    expect(mockTestRepository.create).not.toHaveBeenCalled()
    expect(mockTestRepository.update).not.toHaveBeenCalled()
  })

  it('duplicates all template configuration, activates, and deletes unused templates', async () => {
    const { examTemplateRepository, mockTestRepository, auditRepository } = mockAdminCms()
    const service = await import('@/server/services/admin-cms.service')

    const duplicated = await service.duplicateMockTest('template-1', 'admin-1')
    expect(duplicated.success && duplicated.data).toMatchObject({
      title: 'Premium Mock Copy',
      durationMinutes: 60,
      passingPercentage: 70,
      questionCount: 20,
      randomized: true,
    })
    expect(examTemplateRepository.createTemplate).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Premium Mock Copy',
      durationMinutes: 60,
      passingPercentage: 70,
      questionCount: 20,
      shuffleQuestions: true,
      isPremium: true,
    }))

    await service.setMockTestPublishState('template-1', false, 'admin-1')
    expect(examTemplateRepository.activateTemplate).toHaveBeenCalledWith('template-1', false)
    await service.deleteMockTest('template-1', 'admin-1')
    expect(examTemplateRepository.deleteTemplate).toHaveBeenCalledWith('template-1')
    expect(auditRepository.recordEvent).toHaveBeenCalledWith(expect.objectContaining({ targetType: 'EXAM_TEMPLATE' }))
    expect(mockTestRepository.duplicate).not.toHaveBeenCalled()
    expect(mockTestRepository.setPublishState).not.toHaveBeenCalled()
    expect(mockTestRepository.delete).not.toHaveBeenCalled()
  })

  it('preserves an exam template when student attempts reference it', async () => {
    const { examTemplateRepository } = mockAdminCms()
    examTemplateRepository.countAttemptsForTemplate.mockResolvedValue(1)
    const service = await import('@/server/services/admin-cms.service')

    const result = await service.deleteMockTest('template-1', 'admin-1')

    expect(result).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    })
    expect(examTemplateRepository.deleteTemplate).not.toHaveBeenCalled()
  })

  it('preserves the module context of templates with student attempts', async () => {
    const { examTemplateRepository } = mockAdminCms(makeTemplate({ moduleId: 'module-1' }))
    examTemplateRepository.countAttemptsForTemplate.mockResolvedValue(1)
    const service = await import('@/server/services/admin-cms.service')

    const result = await service.updateMockTest('template-1', { moduleId: 'module-2' }, 'admin-1')

    expect(result).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    })
    expect(examTemplateRepository.updateTemplate).not.toHaveBeenCalled()
  })
})