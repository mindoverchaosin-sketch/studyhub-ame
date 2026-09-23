'use server'

import { requireStudent } from '@/auth'
import prisma from '@/lib/prisma'
import { progressRepository } from '@/server/repositories/progress.repository'
import { contentAccessService } from '@/server/services/content-access.service'
import { invalidateServiceCache } from '@/server/services/cache'

export async function setLessonCompletion(lessonId: string, completed: boolean) {
  const session = await requireStudent()
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { 
      id: true, 
      moduleId: true, 
      status: true, 
      deletedAt: true,
      module: { select: { id: true, isPremium: true } }
    },
  })

  if (!lesson || lesson.status !== 'PUBLISHED' || lesson.deletedAt) {
    throw new Error('Lesson not found.')
  }

  // Verify the student has access to the parent module
  const access = await contentAccessService.canAccessLesson(session.user.id, lesson.module?.isPremium ?? false)
  if (!access.allowed) {
    throw new Error(access.reason || 'Access denied.')
  }

  const status = completed ? 'COMPLETED' : 'IN_PROGRESS'
  const progress = await progressRepository.upsertLessonProgress(session.user.id, lesson.id, {
    status,
    percentComplete: completed ? 100 : 0,
  })

  const publishedLessons = await prisma.lesson.findMany({
    where: { moduleId: lesson.moduleId, status: 'PUBLISHED', deletedAt: null },
    select: { id: true },
  })
  const completedLessons = await prisma.lessonProgress.count({
    where: {
      userId: session.user.id,
      status: 'COMPLETED',
      lessonId: { in: publishedLessons.map((item) => item.id) },
      deletedAt: null,
    },
  })
  const percentComplete = publishedLessons.length > 0
    ? Math.round((completedLessons / publishedLessons.length) * 100)
    : 0
  const moduleStatus = percentComplete === 100 ? 'COMPLETED' : percentComplete > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'

  await prisma.moduleProgress.upsert({
    where: { userId_moduleId: { userId: session.user.id, moduleId: lesson.moduleId } },
    update: { status: moduleStatus, percentComplete },
    create: { userId: session.user.id, moduleId: lesson.moduleId, status: moduleStatus, percentComplete },
  })

  for (const cacheKey of ['dashboard-summary', 'study-planner', 'progress-insights', 'achievement-summary', 'continue-learning', 'goal-progress']) {
    invalidateServiceCache(cacheKey, session.user.id)
  }

  return { lessonProgress: progress, moduleProgress: { percentComplete } }
}