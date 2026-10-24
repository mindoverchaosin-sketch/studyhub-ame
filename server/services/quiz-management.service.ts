import type { Prisma, Status } from '@prisma/client'
import { NotFoundError, ValidationError } from '@/auth'
import { moduleRepository } from '@/server/repositories/module.repository'
import { questionBankRepository } from '@/server/repositories/question-bank.repository'
import { quizRepository } from '@/server/repositories/quiz.repository'

export type QuizManagementFilters = {
  moduleId?: string
  search?: string
  status?: Status | 'ALL'
}

export type QuizManagementInput = {
  moduleId: string
  title: string
  description?: string | null
  timeLimitMinutes?: number | null
  passingScore?: number
  questionBankIds: string[]
}

async function validateAssociations(moduleId: string, bankIds: string[]) {
  const selectedModule = await moduleRepository.findById(moduleId)
  if (!selectedModule || selectedModule.deletedAt) throw new ValidationError('Select an available module.')

  const uniqueBankIds = [...new Set(bankIds)]
  const banks = await Promise.all(uniqueBankIds.map((id) => questionBankRepository.findById(id)))
  if (banks.some((bank) => !bank || bank.deletedAt)) {
    throw new ValidationError('One or more selected question banks are unavailable.')
  }

  return uniqueBankIds
}

function validateInput(input: QuizManagementInput) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ValidationError('Quiz details are required.')
  }
  if (typeof input.moduleId !== 'string' || !input.moduleId.trim()) {
    throw new ValidationError('Select a module.')
  }
  if (input.description !== undefined && input.description !== null && typeof input.description !== 'string') {
    throw new ValidationError('Quiz description is invalid.')
  }
  if (!Array.isArray(input.questionBankIds) || input.questionBankIds.some((id) => typeof id !== 'string' || !id.trim())) {
    throw new ValidationError('Question bank selection is invalid.')
  }
  if (typeof input.title !== 'string') throw new ValidationError('Quiz title is required.')
  const title = input.title.trim()
  if (!title) throw new ValidationError('Quiz title is required.')
  const passingScore = input.passingScore ?? 70
  if (!Number.isInteger(passingScore) || passingScore < 0 || passingScore > 100) {
    throw new ValidationError('Passing score must be between 0 and 100.')
  }
  if (input.timeLimitMinutes !== undefined && input.timeLimitMinutes !== null && (!Number.isInteger(input.timeLimitMinutes) || input.timeLimitMinutes < 0)) {
    throw new ValidationError('Time limit must be a non-negative whole number.')
  }
  return title
}

export class QuizManagementService {
  async list(filters: QuizManagementFilters = {}) {
    return quizRepository.findForAdmin(filters)
  }

  async create(input: QuizManagementInput) {
    const title = validateInput(input)
    const questionBankIds = await validateAssociations(input.moduleId, input.questionBankIds)
    return quizRepository.create({
      title,
      description: input.description?.trim() || null,
      module: { connect: { id: input.moduleId } },
      timeLimitMinutes: input.timeLimitMinutes ?? 0,
      passingScore: input.passingScore ?? 70,
      status: 'DRAFT',
      questionBanks: { connect: questionBankIds.map((id) => ({ id })) },
    })
  }

  async update(id: string, input: QuizManagementInput) {
    const title = validateInput(input)
    return quizRepository.transaction(async (tx) => {
      const existing = await tx.quiz.findFirst({
        where: { id, deletedAt: null },
        include: { questionBanks: { select: { id: true } }, _count: { select: { attempts: true } } },
      })
      if (!existing) throw new NotFoundError('Quiz not found.')

      const questionBankIds = await validateAssociationsInTransaction(tx, input.moduleId, input.questionBankIds)
      const existingBankIds = existing.questionBanks.map((bank) => bank.id).sort()
      const requestedBankIds = [...questionBankIds].sort()
      const changedAssociations = existingBankIds.length !== requestedBankIds.length
        || existingBankIds.some((bankId, index) => bankId !== requestedBankIds[index])
      const isMoving = existing.moduleId !== input.moduleId
      if (existing._count.attempts > 0 && (isMoving || changedAssociations)) {
        throw new ValidationError('A quiz with student attempts cannot be moved or have its question banks changed. Archive it and create a new quiz to preserve history.')
      }
      if (isMoving) {
        await tx.module.updateMany({
          where: { id: existing.moduleId, canonicalQuizId: id },
          data: { canonicalQuizId: null },
        })
      }

      return tx.quiz.update({
        where: { id },
        data: {
          title,
          description: input.description?.trim() || null,
          module: { connect: { id: input.moduleId } },
          timeLimitMinutes: input.timeLimitMinutes ?? 0,
          passingScore: input.passingScore ?? 70,
          questionBanks: { set: questionBankIds.map((bankId) => ({ id: bankId })) },
        },
      })
    })
  }

  async setStatus(id: string, status: Extract<Status, 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>) {
    return quizRepository.transaction(async (tx) => {
      const existing = await tx.quiz.findFirst({ where: { id, deletedAt: null } })
      if (!existing) throw new NotFoundError('Quiz not found.')

      if (status !== 'PUBLISHED') {
        await tx.module.updateMany({
          where: { id: existing.moduleId, canonicalQuizId: id },
          data: { canonicalQuizId: null },
        })
      }

      return tx.quiz.update({
        where: { id },
        data: {
          status,
          ...(status === 'PUBLISHED' ? { publishedAt: new Date() } : { publishedAt: null }),
        },
      })
    })
  }

  async setCanonicalQuiz(moduleId: string, quizId: string | null) {
    if (typeof moduleId !== 'string' || !moduleId.trim()) throw new ValidationError('Select a module.')
    if (quizId !== null && (typeof quizId !== 'string' || !quizId.trim())) {
      throw new ValidationError('Select a valid quiz or clear the canonical quiz.')
    }

    return quizRepository.transaction(async (tx) => {
      const moduleRecord = await tx.module.findUnique({
        where: { id: moduleId },
        select: { id: true, canonicalQuizId: true, deletedAt: true },
      })
      if (!moduleRecord || moduleRecord.deletedAt) throw new NotFoundError('Module not found.')

      if (quizId !== null) {
        const quiz = await tx.quiz.findUnique({
          where: { id: quizId },
          select: { id: true, moduleId: true, status: true, deletedAt: true },
        })
        if (!quiz) throw new NotFoundError('Quiz not found.')
        if (quiz.moduleId !== moduleId) throw new ValidationError('The canonical quiz must belong to this module.')
        if (quiz.status !== 'PUBLISHED' || quiz.deletedAt !== null) {
          throw new ValidationError('Only a published, available quiz can be designated as canonical.')
        }
      }

      await tx.module.update({
        where: { id: moduleId },
        data: { canonicalQuizId: quizId },
      })

      return {
        id: moduleId,
        previousCanonicalQuizId: moduleRecord.canonicalQuizId,
        canonicalQuizId: quizId,
      }
    })
  }
}

async function validateAssociationsInTransaction(tx: Prisma.TransactionClient, moduleId: string, bankIds: string[]) {
  const selectedModule = await tx.module.findUnique({ where: { id: moduleId }, select: { id: true, deletedAt: true } })
  if (!selectedModule || selectedModule.deletedAt) throw new ValidationError('Select an available module.')

  const uniqueBankIds = [...new Set(bankIds)]
  const banks = await Promise.all(uniqueBankIds.map((id) => tx.questionBank.findUnique({ where: { id }, select: { id: true, deletedAt: true } })))
  if (banks.some((bank) => !bank || bank.deletedAt)) {
    throw new ValidationError('One or more selected question banks are unavailable.')
  }

  return uniqueBankIds
}

export const quizManagementService = new QuizManagementService()
