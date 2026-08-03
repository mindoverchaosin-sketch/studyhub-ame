import type { DashboardDTO, DashboardSummaryDTO } from '@/server/application/dto/dashboard.dto'
import { courseRepository } from '@/server/repositories/course.repository'
import { examAttemptRepository } from '@/server/repositories/exam-attempt.repository'
import { moduleRepository } from '@/server/repositories/module.repository'
import { progressRepository } from '@/server/repositories/progress.repository'
import { sectionRepository } from '@/server/repositories/section.repository'
import { userRepository } from '@/server/repositories/user.repository'
import { getAdaptiveLearningData } from '@/server/services/adaptive-learning.service'
import { getCacheKey, invalidateServiceCache, withServiceCache } from '@/server/services/cache'
import { instrumentService } from '@/lib/logger'
import { timeAsync, timeSync } from '@/lib/timing'

function formatRelativeTime(date: Date): string {
  const now = Date.now()
  const diffMinutes = Math.max(1, Math.round((now - date.getTime()) / 60000))
  if (diffMinutes < 60) return `${diffMinutes} min ago`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  const diffDays = Math.round(diffHours / 24)
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

export async function getDashboardSummary(studentId: string): Promise<DashboardSummaryDTO> {
  const cacheKey = getCacheKey('dashboard-summary', studentId)
  return instrumentService('DashboardService', 'getDashboardSummary', async () => {
    return withServiceCache(cacheKey, 60_000, async () => {
      try {
        const [moduleProgressRows, lessonProgressRows, streakData, attempts, adaptiveData] = await timeAsync('dashboard', 'load_summary_data', async () => Promise.all([
          progressRepository.findModuleProgressByUser(studentId),
          progressRepository.findLessonProgressByUser(studentId),
          progressRepository.findStudyStreak(studentId),
          examAttemptRepository.listAttempts(studentId),
          getAdaptiveLearningData(studentId),
        ]))

        return await timeAsync('dashboard', 'build_summary', async () => {
          const completedModules = moduleProgressRows.filter((entry: any) => (entry.percentComplete ?? 0) >= 100).length
          const moduleIds = Array.from(new Set(moduleProgressRows.map((entry: any) => entry.moduleId).filter(Boolean)))
          const resolvedModules = moduleIds.length > 0
            ? await moduleRepository.findManyByIds(moduleIds)
            : []
          const totalModules = resolvedModules.length || moduleProgressRows.length
          const completedLessons = lessonProgressRows.filter((entry: any) => (entry.percentComplete ?? 0) >= 100).length
          const questionsSolved = attempts.length > 0
            ? (await examAttemptRepository.getAttemptQuestionsByAttemptIds(attempts.map((attempt: any) => attempt.id))).length
            : 0
          const mockExamsTaken = attempts.filter((attempt: any) => attempt.status === 'SUBMITTED').length
          const averageMockScore = mockExamsTaken > 0
            ? Math.round(attempts.reduce((sum: number, attempt: any) => sum + (attempt.percentage ?? 0), 0) / mockExamsTaken)
            : 0
          const revisionQueueCount = adaptiveData?.reviewQueue?.length ?? 0
          const weeklyStudyMinutes = Math.max(0, completedLessons * 15 + Math.max(0, (adaptiveData?.performanceSummary?.recentAccuracy ?? 0) / 10))

          return {
            readinessScore: adaptiveData?.performanceSummary?.recentAccuracy ?? 0,
            currentStreak: streakData?.currentStreak ?? 0,
            longestStreak: streakData?.longestStreak ?? 0,
            modulesCompleted: completedModules,
            totalModules,
            questionsSolved: questionsSolved,
            mockExamsTaken,
            averageMockScore,
            revisionQueueCount,
            weeklyStudyMinutes,
          }
        })
      } catch {
        return {
          readinessScore: 0,
          currentStreak: 0,
          longestStreak: 0,
          modulesCompleted: 0,
          totalModules: 0,
          questionsSolved: 0,
          mockExamsTaken: 0,
          averageMockScore: 0,
          revisionQueueCount: 0,
          weeklyStudyMinutes: 0,
        }
      }
    })
  })
}

export async function getStudentDashboardData(userId: string): Promise<DashboardDTO> {
  return instrumentService('DashboardService', 'getStudentDashboardData', async () => {
    return timeAsync('dashboard', 'total', async () => {
      const [user, courseProgressRows, lessonProgressRows, moduleProgressRows, recentLessonProgress, recentQuizAttempts, streak] = await timeAsync('dashboard', 'load_dashboard_data', async () => Promise.all([
        userRepository.findById(userId),
        progressRepository.findProgressRowsByUser(userId),
        progressRepository.findLessonProgressByUser(userId),
        progressRepository.findModuleProgressByUser(userId),
        progressRepository.findRecentLessonProgress(userId),
        progressRepository.findRecentQuizAttempts(userId),
        progressRepository.findStudyStreak(userId),
      ]))

      const courseProgress = courseProgressRows[0]
      const firstLesson = lessonProgressRows[0]
      const firstModule = moduleProgressRows[0]
      const completedLessons = lessonProgressRows.filter((entry: any) => (entry.percentComplete ?? 0) >= 100).length
      const completedModules = moduleProgressRows.filter((entry: any) => (entry.percentComplete ?? 0) >= 100).length
      const averageQuizScore = recentQuizAttempts.length > 0 ? Math.round(recentQuizAttempts.reduce((sum: number, attempt: any) => sum + (attempt.score ?? 0), 0) / recentQuizAttempts.length) : 0
      const courseCompletion = courseProgress?.status === 'COMPLETED' || (courseProgress?.completionPercent ?? 0) >= 100 ? 100 : Math.min(100, Math.max(0, courseProgress?.completionPercent ?? 0))

      const [lessonDetail, moduleDetail, courseDetail] = await timeAsync('dashboard', 'load_reference_data', async () => Promise.all([
        firstLesson?.lessonId ? sectionRepository.findById(firstLesson.lessonId) : Promise.resolve(null),
        firstModule?.moduleId ? moduleRepository.findById(firstModule.moduleId) : Promise.resolve(null),
        courseProgress?.courseId ? courseRepository.findById(courseProgress.courseId) : Promise.resolve(null),
      ]))

      return timeSync('dashboard', 'build_dashboard', () => {
        const continueLearning = firstLesson
          ? [
              {
                id: firstLesson.id,
                lesson: {
                  id: firstLesson.lessonId,
                  title: firstLesson.lesson?.title ?? lessonDetail?.title ?? 'Continue learning',
                  description: firstLesson.lesson?.description ?? lessonDetail?.description ?? null,
                  href: `/student/topics/${firstLesson.lesson?.slug ?? lessonDetail?.slug ?? 'welcome'}`,
                },
                module: {
                  title: moduleDetail?.title ?? 'Learning module',
                  href: moduleDetail ? `/student/courses/${courseDetail?.slug ?? 'course'}/modules/${moduleDetail.slug}` : '/modules',
                },
                progress: {
                  progress: firstLesson.percentComplete ?? 0,
                  remainingTime: `${Math.max(10, (lessonDetail?.durationMinutes ?? 20) - Math.round((firstLesson.percentComplete ?? 0) / 10))} min`,
                  lastStudied: formatRelativeTime(firstLesson.updatedAt ?? new Date()),
                },
              },
            ]
          : []

        return {
          welcome: {
            studentName: user?.studentProfile?.fullName ?? user?.displayName ?? 'Student',
            targetExam: user?.studentProfile?.targetExam ?? null,
          },
          continueLearning,
          progress: {
            courseCompletion,
            moduleCompletion: moduleProgressRows.length > 0 ? Math.round((completedModules / moduleProgressRows.length) * 100) : 0,
            lessonCompletion: lessonProgressRows.length > 0 ? Math.round((completedLessons / lessonProgressRows.length) * 100) : 0,
            quizScore: averageQuizScore,
          },
          dailyGoal: {
            minutesStudiedToday: Math.max(15, lessonProgressRows.reduce((sum: number, entry: any) => sum + Math.max(5, Math.round((entry.percentComplete ?? 0) / 20)), 0)),
            dailyTarget: 60,
            remainingTime: Math.max(0, 60 - Math.max(15, lessonProgressRows.reduce((sum: number, entry: any) => sum + Math.max(5, Math.round((entry.percentComplete ?? 0) / 20)), 0))),
            weeklyStudyGoalMinutes: 300,
          },
          studyStreak: {
            currentStreak: streak?.currentStreak ?? 0,
            longestStreak: streak?.longestStreak ?? 0,
            weeklyCalendar: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
          },
          recentActivity: [
            ...(recentLessonProgress.length > 0
              ? recentLessonProgress.map((item: any) => ({
                  title: `Lesson updated: ${item.lesson?.title ?? 'Lesson'}`,
                  detail: `${item.percentComplete ?? 0}% complete`,
                  time: formatRelativeTime(item.updatedAt ?? new Date()),
                }))
              : []),
            ...(recentQuizAttempts.length > 0
              ? recentQuizAttempts.map((item: any) => ({
                  title: `Quiz attempted: ${item.quiz?.title ?? 'Quiz'}`,
                  detail: `${item.score ?? 0}% score`,
                  time: formatRelativeTime(item.attemptedAt ?? new Date()),
                }))
              : []),
            ...(courseDetail
              ? [{ title: `Last accessed course`, detail: courseDetail.title, time: formatRelativeTime(courseProgress?.updatedAt ?? new Date()) }]
              : []),
          ].slice(0, 4),
        }
      })
    })
  })
}
