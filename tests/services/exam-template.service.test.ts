import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockExamTemplateRepository } = vi.hoisted(() => ({
  mockExamTemplateRepository: {
    listTemplates: vi.fn().mockResolvedValue([]),
    getTemplate: vi.fn().mockResolvedValue(null),
    createTemplate: vi.fn().mockImplementation((d) => Promise.resolve({ id: 't1', ...d, createdAt: new Date(), updatedAt: new Date() })),
    updateTemplate: vi.fn().mockImplementation((id, d) => Promise.resolve({ id, ...d, createdAt: new Date(), updatedAt: new Date() })),
  },
}))

vi.mock('@/server/repositories/exam-template.repository', () => {
  return {
    examTemplateRepository: mockExamTemplateRepository,
  }
})

import * as service from '@/server/services/exam-template.service'

describe('exam-template.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a template and defaults isPremium to false in the DTO', async () => {
    const dto = await service.createTemplate({ name: 'Sample', questionCount: 10 })
    expect(dto.id).toBeDefined()
    expect(dto.name).toBe('Sample')
    expect(dto.questionCount).toBe(10)
    expect(dto.isPremium).toBe(false)
    expect(mockExamTemplateRepository.createTemplate).toHaveBeenCalledWith(expect.objectContaining({ isPremium: false }))
  })

  it('maps premium and persists an explicit premium flag on create', async () => {
    const dto = await service.createTemplate({ name: 'Sample', questionCount: 10, isPremium: true })

    expect(dto.isPremium).toBe(true)
    expect(mockExamTemplateRepository.createTemplate).toHaveBeenCalledWith(expect.objectContaining({ isPremium: true }))
  })

  it('preserves the existing premium flag when update omits isPremium', async () => {
    mockExamTemplateRepository.getTemplate.mockResolvedValueOnce({
      id: 't1',
      name: 'Sample',
      questionCount: 10,
      isPremium: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const dto = await service.updateTemplate('t1', { name: 'Updated Sample' })

    expect(mockExamTemplateRepository.getTemplate).toHaveBeenCalledWith('t1')
    expect(mockExamTemplateRepository.updateTemplate).toHaveBeenCalledWith('t1', expect.objectContaining({ isPremium: true }))
    expect(dto.isPremium).toBe(true)
  })

  it('supports updating premium explicitly', async () => {
    const dto = await service.updateTemplate('t1', { name: 'Updated Sample', isPremium: false })

    expect(mockExamTemplateRepository.updateTemplate).toHaveBeenCalledWith('t1', expect.objectContaining({ isPremium: false }))
    expect(dto.isPremium).toBe(false)
  })

  it('listTemplates returns array', async () => {
    const list = await service.listTemplates()
    expect(Array.isArray(list)).toBe(true)
  })
})
