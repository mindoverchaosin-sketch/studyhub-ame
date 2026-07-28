import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/server/repositories/exam-template.repository', () => {
  return {
    examTemplateRepository: {
      listTemplates: vi.fn().mockResolvedValue([]),
      getTemplate: vi.fn().mockResolvedValue(null),
      createTemplate: vi.fn().mockImplementation((d) => Promise.resolve({ id: 't1', ...d, createdAt: new Date(), updatedAt: new Date() })),
    },
  }
})

import * as service from '@/server/services/exam-template.service'

describe('exam-template.service', () => {
  it('creates a template and returns DTO', async () => {
    const dto = await service.createTemplate({ name: 'Sample', questionCount: 10 })
    expect(dto.id).toBeDefined()
    expect(dto.name).toBe('Sample')
    expect(dto.questionCount).toBe(10)
  })

  it('listTemplates returns array', async () => {
    const list = await service.listTemplates()
    expect(Array.isArray(list)).toBe(true)
  })
})
