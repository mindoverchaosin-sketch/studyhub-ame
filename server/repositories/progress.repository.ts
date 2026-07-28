import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export class ProgressRepository {
  async findStudentProgress(studentId: string) {
    return prisma.lessonProgress.findMany({
      where: { userId: studentId },
      orderBy: { updatedAt: 'desc' },
    })
  }

  async findTopicProgress(studentId: string, lessonId: string) {
    return prisma.lessonProgress.findFirst({
      where: {
        userId: studentId,
        lessonId,
      },
    })
  }

  async updateTopicProgress(input: Prisma.LessonProgressCreateInput | Prisma.LessonProgressUpdateInput) {
    return prisma.lessonProgress.create({ data: input as Prisma.LessonProgressCreateInput })
  }

  async findProgressRowsByUser(userId: string) {
    return prisma.progress.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } })
  }

  async findStudentProgressByCourse(studentId: string, courseId: string) {
    return prisma.progress.findMany({ where: { userId: studentId, courseId }, orderBy: { updatedAt: 'desc' } })
  }

  async findCompletedTopics(studentId: string) {
    return prisma.progress.findMany({ where: { userId: studentId, status: 'COMPLETED' }, orderBy: { createdAt: 'desc' } })
  }

  async countQuizAttempts() {
    return prisma.quizAttempt.count()
  }

  async findLessonProgressByUser(userId: string) {
    return prisma.lessonProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { lesson: true },
    })
  }

  async findModuleProgressByUser(userId: string) {
    return prisma.moduleProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })
  }

  async findRecentLessonProgress(userId: string) {
    return prisma.lessonProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 3,
      include: { lesson: true },
    })
  }

  async findRecentQuizAttempts(userId: string) {
    return prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { attemptedAt: 'desc' },
      take: 3,
      include: { quiz: true },
    })
  }

  async findQuizAttemptsByUser(userId: string, quizId?: string) {
    return prisma.quizAttempt.findMany({
      where: { userId, ...(quizId ? { quizId } : {}) },
      orderBy: { attemptedAt: 'desc' },
      include: { quiz: true },
    })
  }

  async findAll() {
    return prisma.progress.findMany()
  }

  async findCompletedCourses() {
    return prisma.progress.findMany({ where: { status: 'COMPLETED' } })
  }

  async createQuizAttempt(data: Prisma.QuizAttemptUncheckedCreateInput) {
    return prisma.quizAttempt.create({ data })
  }

  async findStudyStreak(userId: string) {
    return prisma.studyStreak.findUnique({ where: { userId } })
  }

  async upsertLessonProgress(userId: string, lessonId: string, data: Prisma.LessonProgressUpdateInput | Prisma.LessonProgressCreateInput) {
    return prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: data as Prisma.LessonProgressUpdateInput,
      create: data as Prisma.LessonProgressCreateInput,
    })
  }
}

export const progressRepository = new ProgressRepository()
