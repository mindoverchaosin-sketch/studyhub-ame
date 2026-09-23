import type { QuestionBankDTO } from '@/server/application/dto/question-bank.dto'
import type { QuestionDTO } from '@/server/application/dto/question.dto'
import { mapQuestionEntityToDTO } from '@/server/application/mappers/question.mapper'
import { contentAccessService } from '@/server/services/content-access.service'
import { questionBankRepository } from '@/server/repositories/question-bank.repository'
import { questionRepository } from '@/server/repositories/question.repository'
import prisma from '@/lib/prisma'

export type StudentQuestionBankDTO = QuestionBankDTO & {
  questionCount: number
  locked: boolean
  questions: Array<QuestionDTO & { isBookmarked: boolean; selectedOption: number | null; answeredAt: string | null; isAnswered: boolean }>
}

export async function getStudentQuestionBanks(userId: string, search?: string): Promise<StudentQuestionBankDTO[]> {
  const banks = await questionBankRepository.findPublishedWithQuestions(search)

  const questionIds = banks.flatMap((bank) => bank.questions.map((question) => question.id))
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId, resourceId: { in: questionIds }, deletedAt: null },
    select: { resourceId: true },
  })
  const bookmarkedIds = new Set(bookmarks.map((bookmark) => bookmark.resourceId))
  const states = await questionBankRepository.findStudentQuestionStates(userId, questionIds)
  const stateByQuestionId = new Map(states.map((state) => [state.questionId, state]))

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
      questions: access.allowed ? bank.questions.map((question) => {
        const state = stateByQuestionId.get(question.id)
        return {
          ...mapQuestionEntityToDTO(question),
          isBookmarked: bookmarkedIds.has(question.id),
          selectedOption: state?.selectedOption ?? null,
          answeredAt: state?.answeredAt?.toISOString() ?? null,
          isAnswered: state?.answeredAt !== null && state?.answeredAt !== undefined,
        }
      }) : [],
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

export type StudentQuestionPracticeDTO = QuestionDTO & {
  selectedOption: number | null
  answeredAt: string | null
}

export async function getStudentQuestionPractice(userId: string, questionId: string): Promise<StudentQuestionPracticeDTO | null> {
  const question = await getStudentQuestion(userId, questionId)
  if (!question) return null

  const states = await questionBankRepository.findStudentQuestionStates(userId, [questionId])
  const state = states[0]

  return {
    ...question,
    selectedOption: state?.selectedOption ?? null,
    answeredAt: state?.answeredAt?.toISOString() ?? null,
  }
}