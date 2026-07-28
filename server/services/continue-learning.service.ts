import type { ContinueLearningDTO } from '@/server/application/dto/study-planner.dto'
import { examAttemptRepository } from '@/server/repositories/exam-attempt.repository'
import { moduleRepository } from '@/server/repositories/module.repository'
import { progressRepository } from '@/server/repositories/progress.repository'
import { sectionRepository } from '@/server/repositories/section.repository'
import { getCacheKey, withServiceCache } from '@/server/services/cache'

export async function getContinueLearning(studentId: string): Promise<ContinueLearningDTO> {
  const cacheKey = getCacheKey('continue-learning', studentId)
  return withServiceCache(cacheKey, 60_000, async () => {
    try {
      const [lessonProgressRows, moduleProgressRows, attempts] = await Promise.all([
      progressRepository.findLessonProgressByUser(studentId),
      progressRepository.findModuleProgressByUser(studentId),
      examAttemptRepository.listAttempts(studentId),
    ])

    const latestLesson = lessonProgressRows[0]
    const latestModule = moduleProgressRows[0]
    const latestAttempt = attempts.find((attempt: any) => attempt.status === 'SUBMITTED') ?? attempts[0]

    const [lessonDetail, moduleDetail] = await Promise.all([
      latestLesson?.lessonId ? sectionRepository.findById(latestLesson.lessonId) : Promise.resolve(null),
      latestModule?.moduleId ? moduleRepository.findById(latestModule.moduleId) : Promise.resolve(null),
    ])

      return {
        lastModule: moduleDetail?.title ?? latestModule?.moduleId ?? null,
        lastLesson: lessonDetail?.title ?? latestLesson?.lesson?.title ?? null,
        lastQuiz: latestLesson?.lesson?.title ?? null,
        lastMockExam: latestAttempt?.percentage ?? null,
        resumeUrl: '/student/dashboard',
      }
    } catch {
      return {
        lastModule: null,
        lastLesson: null,
        lastQuiz: null,
        lastMockExam: null,
        resumeUrl: '/student/dashboard',
      }
    }
  })
}
