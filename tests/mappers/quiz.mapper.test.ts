import { describe, it, expect } from 'vitest'
import { mapQuizEntityToDTO, mapQuizWithQuestionsEntityToDTO } from '../../server/application/mappers/quiz.mapper'
import type { QuizWithQuestionBanksAndQuestionsEntity, QuizWithQuestionBanksEntity } from '../../server/infrastructure/entities/quiz.entity'

describe('mapQuizEntityToDTO', () => {
  it('maps quiz and banks without questions', () => {
    const now = new Date()
    const entity: QuizWithQuestionBanksEntity = {
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
      deletedAt: null,
      questionBanks: [{ id: 'b1', title: 'Bank 1', description: null, status: 'DRAFT', isPremium: false, createdAt: now, updatedAt: now, deletedAt: null }],
    }

    const dto = mapQuizEntityToDTO(entity)
    expect(dto.questionBanks.length).toBe(1)
    expect(dto.topicId).toBe(entity.moduleId)
  })

  it('maps quiz with questions', () => {
    const now = new Date()
    const entity: QuizWithQuestionBanksAndQuestionsEntity = {
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
      deletedAt: null,
      questionBanks: [
        { id: 'b1', title: 'B1', description: null, status: 'DRAFT', isPremium: false, createdAt: now, updatedAt: now, deletedAt: null, questions: [{ id: 'q1', prompt: 'P', questionType: 'MULTIPLE_CHOICE', options: ['a'], correctOptionIndex: 0, explanation: null, difficulty: 'BEGINNER', status: 'DRAFT', metadata: null, createdAt: now, updatedAt: now, deletedAt: null, questionBankId: 'b1' }] },
      ],
    }

    const dto = mapQuizWithQuestionsEntityToDTO(entity)
    expect(dto.questions?.length).toBe(1)
  })
})
