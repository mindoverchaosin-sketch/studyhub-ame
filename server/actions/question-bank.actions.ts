'use server'

import { requireStudent } from '@/auth'
import prisma from '@/lib/prisma'
import { contentAccessService } from '@/server/services/content-access.service'
import { questionBankRepository } from '@/server/repositories/question-bank.repository'

export async function toggleQuestionBookmark(questionId: string) {
  const session = await requireStudent()
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { questionBank: true },
  })

  if (!question || question.status !== 'PUBLISHED' || question.deletedAt) {
    throw new Error('Question not found.')
  }

  const access = await contentAccessService.canAccessQuestion(session.user.id, question.questionBank.isPremium)
  if (!access.allowed) {
    throw new Error('Question access denied.')
  }

  const existing = await prisma.bookmark.findFirst({
    where: { userId: session.user.id, resourceId: questionId, deletedAt: null },
  })

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } })
    return { bookmarked: false }
  }

  await prisma.bookmark.create({ data: { userId: session.user.id, resourceId: questionId } })
  return { bookmarked: true }
}

export async function saveQuestionAnswer(questionId: string, selectedOption: number | null) {
  const session = await requireStudent()
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { questionBank: true },
  })

  if (!question || question.status !== 'PUBLISHED' || question.deletedAt || question.questionBank.status !== 'PUBLISHED' || question.questionBank.deletedAt) {
    throw new Error('Question not found.')
  }

  const access = await contentAccessService.canAccessQuestion(session.user.id, question.questionBank.isPremium)
  if (!access.allowed) {
    throw new Error('Question access denied.')
  }

  if (selectedOption !== null) {
    if (!Number.isInteger(selectedOption) || selectedOption < 0 || !Array.isArray(question.options) || selectedOption >= question.options.length) {
      throw new Error('Invalid answer option.')
    }
  }

  return questionBankRepository.upsertStudentQuestionState(session.user.id, questionId, selectedOption)
}