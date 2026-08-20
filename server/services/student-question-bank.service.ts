import type { QuestionBankDTO } from '@/server/application/dto/question-bank.dto'
import type { QuestionDTO } from '@/server/application/dto/question.dto'
import { mapQuestionEntityToDTO } from '@/server/application/mappers/question.mapper'
import { contentAccessService } from '@/server/services/content-access.service'
import { questionBankRepository } from '@/server/repositories/question-bank.repository'
import { questionRepository } from '@/server/repositories/question.repository'

export type StudentQuestionBankDTO = QuestionBankDTO & {
  questionCount: number
  locked: boolean
  questions: QuestionDTO[]
}

export async function getStudentQuestionBanks(userId: string, search?: string): Promise<StudentQuestionBankDTO[]> {
  const banks = await questionBankRepository.findPublishedWithQuestions(search)

  return Promise.all(banks.map(async (bank) => {
    const access = await contentAccessService.canAccessQuestionBank(userId, bank.isPremium)
    return {
      id: bank.id,
      title: bank.title,
      description: bank.description,
      status: bank.status,
      isPremium: bank.isPremium,
      createdAt: bank.createdAt.toISOString(),
      updatedAt: bank.updatedAt.toISOString(),
      questionCount: bank.questions.length,
      locked: !access.allowed,
      questions: access.allowed ? bank.questions.map(mapQuestionEntityToDTO) : [],
    }
  }))
}

export async function getStudentQuestion(userId: string, questionId: string): Promise<QuestionDTO | null> {
  const question = await questionRepository.findById(questionId)
  if (!question) return null

  const questionBank = await questionBankRepository.findById(question.questionBankId)
  if (question.status !== 'PUBLISHED' || !questionBank || questionBank.status !== 'PUBLISHED' || questionBank.deletedAt) return null

  const access = await contentAccessService.canAccessQuestion(userId, questionBank.isPremium)
  return access.allowed ? mapQuestionEntityToDTO(question) : null
}