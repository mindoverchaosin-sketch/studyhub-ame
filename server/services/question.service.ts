import type { QuestionDTO } from '@/server/application/dto/question.dto'
import { questionRepository } from '@/server/repositories/question.repository'
import { mapQuestionEntityToDTO } from '@/server/application/mappers/question.mapper'

/**
 * QuestionService
 * Handles question-related database operations
 */

export async function getQuestionsByTopic(questionBankId: string): Promise<QuestionDTO[]> {
  return (await questionRepository.findByTopic(questionBankId)).map(mapQuestionEntityToDTO)
}

export async function getQuestionByTopic(id: string): Promise<QuestionDTO | null> {
  const question = await questionRepository.findById(id)
  return question ? mapQuestionEntityToDTO(question) : null
}

export async function getQuestionCount(): Promise<number> {
  return questionRepository.countAll()
}
