import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export class ExamAttemptRepository {
  async createAttempt(data: any) {
    return (prisma as any).examAttempt.create({ data })
  }

  async createAttemptWithQuestions(attemptData: any, questions: Array<{ questionId: string; displayOrder: number }>) {
    // create attempt and its question rows transactionally
    const toCreate = questions.map((q) => ({ attemptId: undefined as any, questionId: q.questionId, displayOrder: q.displayOrder }))

    const result = await (prisma as any).$transaction(async (tx: any) => {
      const createdAttempt = await tx.examAttempt.create({ data: attemptData })
      const mapped = questions.map((q) => ({ attemptId: createdAttempt.id, questionId: q.questionId, displayOrder: q.displayOrder }))
      if (mapped.length) {
        await tx.examAttemptQuestion.createMany({ data: mapped })
      }
      return createdAttempt
    })

    return result
  }

  async getAttemptQuestions(attemptId: string) {
    return (prisma as any).examAttemptQuestion.findMany({ where: { attemptId }, orderBy: { displayOrder: 'asc' } })
  }

  async countAll() {
    return (prisma as any).examAttempt.count()
  }

  async findAttemptIdByQuestionId(attemptQuestionId: string) {
    const row = await (prisma as any).examAttemptQuestion.findUnique({ where: { id: attemptQuestionId }, select: { attemptId: true } })
    return row?.attemptId ?? null
  }

  async getAttemptQuestionsByAttemptIds(attemptIds: string[]) {
    if (!attemptIds.length) return []
    return (prisma as any).examAttemptQuestion.findMany({ where: { attemptId: { in: attemptIds } }, orderBy: { displayOrder: 'asc' } })
  }

  async getAnsweredQuestionIdsByStudent(studentId: string) {
    const rows = await prisma.$queryRaw<Array<{ questionId: string }>>(Prisma.sql`
      SELECT DISTINCT attempt_question."questionId"
      FROM "ExamAttemptQuestion" AS attempt_question
      INNER JOIN "ExamAttemptAnswer" AS attempt_answer
        ON attempt_answer."attemptQuestionId" = attempt_question."id"
      INNER JOIN "ExamAttempt" AS attempt
        ON attempt."id" = attempt_question."attemptId"
      WHERE attempt."studentId" = ${studentId}
        AND attempt_answer."selectedOption" IS NOT NULL
    `)

    return rows.map((row) => row.questionId)
  }

  async loadAttempt(id: string) {
    return (prisma as any).examAttempt.findUnique({ where: { id } })
  }

  async saveAnswer(attemptQuestionId: string, answerData: any) {
    // upsert: allow updating existing answer for the attemptQuestion
    const existing = await (prisma as any).examAttemptAnswer.findFirst({ where: { attemptQuestionId } })
    if (existing) {
      return (prisma as any).examAttemptAnswer.update({ where: { id: existing.id }, data: answerData })
    }
    return (prisma as any).examAttemptAnswer.create({ data: { attemptQuestionId, ...answerData } })
  }

  async submitAttempt(id: string, scoreData: any) {
    return (prisma as any).examAttempt.update({ where: { id }, data: { ...scoreData, status: 'SUBMITTED', submittedAt: new Date() } })
  }

  async bookmarkQuestion(attemptQuestionId: string, bookmarked: boolean) {
    return (prisma as any).examAttemptAnswer.upsert({
      where: { attemptQuestionId },
      create: { attemptQuestionId, bookmarked, answeredAt: null },
      update: { bookmarked },
    })
  }

  async markForReview(attemptQuestionId: string, markedForReview: boolean) {
    return (prisma as any).examAttemptAnswer.upsert({
      where: { attemptQuestionId },
      create: { attemptQuestionId, markedForReview, answeredAt: null },
      update: { markedForReview },
    })
  }

  async loadAttemptWithRelations(id: string) {
    return (prisma as any).examAttempt.findUnique({ where: { id }, include: { examAttemptQuestion: true, examAttemptAnswer: true } })
  }

  async expireAttempt(id: string) {
    return (prisma as any).examAttempt.update({ where: { id }, data: { status: 'EXPIRED' } })
  }

  async listAttempts(studentId: string, params: { skip?: number; take?: number } = {}) {
    return (prisma as any).examAttempt.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' }, skip: params.skip ?? 0, take: params.take ?? 20 })
  }
}

export const examAttemptRepository = new ExamAttemptRepository()
