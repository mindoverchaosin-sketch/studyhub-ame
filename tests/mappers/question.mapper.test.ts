import { describe, it, expect } from 'vitest'
import { mapQuestionEntityToDTO } from '../../server/application/mappers/question.mapper'
import type { QuestionEntity } from '../../server/infrastructure/entities/question.entity'

describe('mapQuestionEntityToDTO', () => {
  it('parses string array options and maps correct answer', () => {
    const entity: QuestionEntity = {
      id: 'q1',
      prompt: 'What?',
      options: ['A', 'B', 'C'],
      questionType: 'MULTIPLE_CHOICE',
      correctOptionIndex: 1,
      explanation: null,
      difficulty: 'BEGINNER',
      status: 'DRAFT',
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      questionBankId: 'qb1',
    }

    const dto = mapQuestionEntityToDTO(entity)

    expect(dto.options.length).toBe(3)
    expect(dto.optionB).toBe('B')
    expect(dto.correctAnswer).toBe('B')
  })

  it('parses object options and handles missing correct index', () => {
    const entity: QuestionEntity = {
      id: 'q2',
      prompt: 'Which?',
      options: [{ text: 'X' }, { text: 'Y' }],
      questionType: 'MULTIPLE_CHOICE',
      correctOptionIndex: null,
      explanation: 'ex',
      difficulty: 'INTERMEDIATE',
      status: 'DRAFT',
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      questionBankId: 'qb2',
    }

    const dto = mapQuestionEntityToDTO(entity)
    expect(dto.correctAnswer).toBeNull()
    expect(dto.optionA).toBe('X')
  })
})
