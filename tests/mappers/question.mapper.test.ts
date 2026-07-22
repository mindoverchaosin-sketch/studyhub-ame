import { describe, it, expect } from 'vitest'
import { mapQuestionEntityToDTO } from '../../server/application/mappers/question.mapper'

describe('mapQuestionEntityToDTO', () => {
  it('parses string array options and maps correct answer', () => {
    const entity: any = {
      id: 'q1',
      prompt: 'What?',
      options: ['A', 'B', 'C'],
      correctOptionIndex: 1,
      explanation: null,
      difficulty: 'EASY',
      questionBankId: 'qb1',
    }

    const dto = mapQuestionEntityToDTO(entity)

    expect(dto.options.length).toBe(3)
    expect(dto.optionB).toBe('B')
    expect(dto.correctAnswer).toBe('B')
  })

  it('parses object options and handles missing correct index', () => {
    const entity: any = {
      id: 'q2',
      prompt: 'Which?',
      options: [{ text: 'X' }, { text: 'Y' }],
      correctOptionIndex: null,
      explanation: 'ex',
      difficulty: 'MEDIUM',
      questionBankId: 'qb2',
    }

    const dto = mapQuestionEntityToDTO(entity)
    expect(dto.correctAnswer).toBeNull()
    expect(dto.optionA).toBe('X')
  })
})
