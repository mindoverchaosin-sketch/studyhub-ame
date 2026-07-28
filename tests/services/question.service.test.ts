import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('question.service', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('builds an admin question library DTO with filtering and pagination', async () => {
    const questionRepo = {
      findAdmin: vi.fn().mockResolvedValue([
        { id: 'q1', prompt: 'What is hydraulics?', options: ['A', 'B'], correctOptionIndex: 0, explanation: 'It is the fluid system.', difficulty: 'BEGINNER', questionBankId: 'b1', status: 'PUBLISHED', metadata: { tags: ['hydraulics'], timeEstimateMinutes: 4 }, createdAt: new Date(), updatedAt: new Date() },
      ]),
      countAdmin: vi.fn().mockResolvedValue(1),
      findById: vi.fn(),
      countAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateStatus: vi.fn(),
      remove: vi.fn(),
      archive: vi.fn(),
      restore: vi.fn(),
      findByBank: vi.fn(),
    }

    const questionBankRepo = {
      findAll: vi.fn().mockResolvedValue([{ id: 'b1', title: 'Airframes', description: 'Core questions' }]),
      findById: vi.fn(),
    }

    vi.doMock('@/server/repositories/question.repository', () => ({ questionRepository: questionRepo }))
    vi.doMock('@/server/repositories/question-bank.repository', () => ({ questionBankRepository: questionBankRepo }))

    const { getAdminQuestionLibrary } = await import('../../server/services/question.service')
    const dto = await getAdminQuestionLibrary({ search: 'hydraulics', page: 1, pageSize: 10 })

    expect(dto.items[0].question).toContain('hydraulics')
    expect(dto.total).toBe(1)
    expect(dto.items[0].metadata.tags).toContain('hydraulics')
  })

  it('detects duplicates and validates imported questions', async () => {
    const questionRepo = {
      findAdmin: vi.fn().mockResolvedValue([]),
      countAdmin: vi.fn().mockResolvedValue(0),
      findById: vi.fn(),
      countAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateStatus: vi.fn(),
      remove: vi.fn(),
      archive: vi.fn(),
      restore: vi.fn(),
      findByBank: vi.fn().mockResolvedValue([
        { id: 'q1', prompt: 'What is hydraulic pressure?', options: ['A', 'B'], correctOptionIndex: 0, explanation: 'basic', difficulty: 'BEGINNER', questionBankId: 'b1', status: 'PUBLISHED', metadata: { tags: [], timeEstimateMinutes: 2 }, createdAt: new Date(), updatedAt: new Date() },
      ]),
    }

    const questionBankRepo = {
      findAll: vi.fn().mockResolvedValue([{ id: 'b1', title: 'Airframes', description: 'Core questions' }]),
      findById: vi.fn(),
    }

    vi.doMock('@/server/repositories/question.repository', () => ({ questionRepository: questionRepo }))
    vi.doMock('@/server/repositories/question-bank.repository', () => ({ questionBankRepository: questionBankRepo }))

    const { bulkImportQuestions } = await import('../../server/services/question.service')
    const result = await bulkImportQuestions({
      questionBankId: 'b1',
      fileBuffer: Buffer.from('prompt,optionA,optionB,correctOptionIndex\nWhat is hydraulic pressure?,A,B,0\nWhat is missing?,A,B,1\n'),
      fileName: 'questions.csv',
    })

    expect(result.importedCount).toBe(1)
    expect(result.duplicateCount).toBe(1)
    expect(result.preview[1].validationErrors).toEqual([])
  })
})
