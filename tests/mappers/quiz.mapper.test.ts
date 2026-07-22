import { describe, it, expect } from 'vitest'
import { mapQuizEntityToDTO, mapQuizWithQuestionsEntityToDTO } from '../../server/application/mappers/quiz.mapper'

describe('mapQuizEntityToDTO', () => {
  it('maps quiz and banks without questions', () => {
    const entity: any = {
      id: 'quiz1',
      moduleId: 'm1',
      title: 'Quiz 1',
      description: null,
      passingScore: 70,
      timeLimitMinutes: 10,
      status: 'PUBLISHED',
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      questionBanks: [{ id: 'b1', title: 'Bank 1', description: null }],
    }

    const dto = mapQuizEntityToDTO(entity)
    expect(dto.questionBanks.length).toBe(1)
    expect(dto.topicId).toBe(entity.moduleId)
  })

  it('maps quiz with questions', () => {
    const entity: any = {
      id: 'quiz2',
      moduleId: 'm2',
      title: 'Quiz 2',
      description: null,
      passingScore: 50,
      timeLimitMinutes: 5,
      status: 'PUBLISHED',
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      questionBanks: [
        { id: 'b1', title: 'B1', description: null, questions: [{ id: 'q1', prompt: 'P', options: ['a'], correctOptionIndex: 0, explanation: null, difficulty: 'EASY', questionBankId: 'b1' }] },
      ],
    }

    const dto = mapQuizWithQuestionsEntityToDTO(entity)
    expect(dto.questions?.length).toBe(1)
  })
})
