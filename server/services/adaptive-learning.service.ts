import { moduleRepository } from '@/server/repositories/module.repository'
import { progressRepository } from '@/server/repositories/progress.repository'
import { sectionRepository } from '@/server/repositories/section.repository'

export type AdaptiveLearningDTO = {
  reviewQueue: Array<{
    id: string
    title: string
    type: 'lesson' | 'quiz'
    priority: 'high' | 'medium' | 'low'
    detail: string
    href: string
  }>
  recommendations: Array<{
    id: string
    type: 'revision' | 'practice' | 'next-step'
    title: string
    detail: string
    href: string
  }>
  spacedRepetition: Array<{
    id: string
    title: string
    dueLabel: string
    status: 'due' | 'scheduled'
  }>
  performanceSummary: {
    recentAccuracy: number
    weakTopics: string[]
    improvedTopics: string[]
  }
  goals: {
    daily: {
      target: number
      completed: number
      remaining: number
    }
    weekly: {
      target: number
      completed: number
      remaining: number
    }
  }
}

function buildHref(slug: string, type: 'lesson' | 'quiz') {
  return type === 'quiz' ? `/quiz?topic=${slug}` : `/student/topics/${slug}`
}

export async function getAdaptiveLearningData(userId: string): Promise<AdaptiveLearningDTO> {
  const [lessonProgressRows, moduleProgressRows, recentQuizAttempts] = await Promise.all([
    progressRepository.findLessonProgressByUser(userId),
    progressRepository.findModuleProgressByUser(userId),
    progressRepository.findRecentQuizAttempts(userId),
  ])

  const weakLessons = lessonProgressRows
    .filter((entry: any) => (entry.percentComplete ?? 0) < 70)
    .sort((a: any, b: any) => (a.percentComplete ?? 0) - (b.percentComplete ?? 0))

  const reviewLessonIds = weakLessons.slice(0, 3).map((entry: any) => entry.lesson?.id).filter(Boolean)
  const reviewLessonDetails = reviewLessonIds.length > 0
    ? (typeof sectionRepository.findManyByIds === 'function'
      ? await sectionRepository.findManyByIds(reviewLessonIds)
      : await Promise.all(reviewLessonIds.map((id: string) => sectionRepository.findById(id))))
    : []
  const reviewLessonMap = new Map(reviewLessonDetails.map((lesson: any) => [lesson.id, lesson]))
  const reviewModuleIds = reviewLessonDetails.map((lesson: any) => lesson.moduleId).filter(Boolean)
  const reviewModules = reviewModuleIds.length > 0
    ? (typeof moduleRepository.findManyByIds === 'function'
      ? await moduleRepository.findManyByIds(reviewModuleIds)
      : await Promise.all(reviewModuleIds.map((id: string) => moduleRepository.findById(id))))
    : []
  const reviewModuleMap = new Map(reviewModules.map((module: any) => [module.id, module]))

  const reviewQueue = weakLessons.slice(0, 3).map((entry: any) => {
    const lessonDetail = entry.lesson?.id ? reviewLessonMap.get(entry.lesson.id) : null
    const moduleDetail = lessonDetail?.moduleId ? reviewModuleMap.get(lessonDetail.moduleId) : null
    const percentComplete = entry.percentComplete ?? 0
    const priority: 'high' | 'medium' | 'low' = percentComplete < 50 ? 'high' : percentComplete < 75 ? 'medium' : 'low'

    return {
      id: entry.id,
      title: lessonDetail?.title ?? entry.lesson?.title ?? 'Revision lesson',
      type: 'lesson' as const,
      priority,
      detail: `${entry.percentComplete ?? 0}% complete • ${moduleDetail?.title ?? 'module'}`,
      href: buildHref(lessonDetail?.slug ?? entry.lesson?.slug ?? 'revision', 'lesson'),
    }
  })

  const recentAccuracy = recentQuizAttempts.length > 0
    ? Math.round(recentQuizAttempts.reduce((sum: number, attempt: any) => sum + (attempt.score ?? 0), 0) / recentQuizAttempts.length)
    : 0

  const weakTopics = weakLessons.slice(0, 3).map((entry: any) => entry.lesson?.title ?? 'Topic').filter(Boolean)
  const improvedTopics = recentQuizAttempts
    .filter((attempt: any) => (attempt.score ?? 0) >= 80)
    .slice(0, 3)
    .map((attempt: any) => attempt.quiz?.title ?? 'Quiz')

  return {
    reviewQueue,
    recommendations: [
      {
        id: 'revision-recommendation',
        type: 'revision' as const,
        title: 'Revisit weak topics',
        detail: weakTopics.length > 0 ? `Focus on ${weakTopics[0]} before your next session.` : 'Keep your revision cadence steady with a short recap.',
        href: '/student/dashboard',
      },
      {
        id: 'practice-recommendation',
        type: 'practice' as const,
        title: 'Practice a short quiz',
        detail: 'Use the quiz engine to convert weak topics into recall confidence.',
        href: '/quiz',
      },
      {
        id: 'next-step-recommendation',
        type: 'next-step' as const,
        title: 'Continue the current module',
        detail: 'Use the module progress signal to stay aligned with your plan.',
        href: '/modules',
      },
    ],
    spacedRepetition: weakLessons.slice(0, 3).map((entry: any, index: number) => ({
      id: entry.id,
      title: entry.lesson?.title ?? 'Revision topic',
      dueLabel: index === 0 ? 'Due today' : index === 1 ? 'Due tomorrow' : 'Scheduled this week',
      status: index === 0 ? 'due' as const : 'scheduled' as const,
    })),
    performanceSummary: {
      recentAccuracy,
      weakTopics,
      improvedTopics,
    },
    goals: {
      daily: {
        target: 45,
        completed: Math.max(0, Math.min(45, Math.round(recentAccuracy / 2))),
        remaining: Math.max(0, 45 - Math.max(0, Math.min(45, Math.round(recentAccuracy / 2)))),
      },
      weekly: {
        target: 240,
        completed: Math.max(0, Math.min(240, Math.round(recentAccuracy * 2))),
        remaining: Math.max(0, 240 - Math.max(0, Math.min(240, Math.round(recentAccuracy * 2)))),
      },
    },
  }
}
