import type { AchievementDTO, AchievementSummaryDTO } from '@/server/application/dto/achievement.dto'
import { examAttemptRepository } from '@/server/repositories/exam-attempt.repository'
import { progressRepository } from '@/server/repositories/progress.repository'
import { getDashboardSummary } from '@/server/services/dashboard.service'
import { getAdaptiveLearningData } from '@/server/services/adaptive-learning.service'
import { getGoalProgress } from '@/server/services/goal-tracking.service'
import { getCacheKey, withServiceCache } from '@/server/services/cache'
import { instrumentService } from '@/lib/logger'

const ACHIEVEMENT_TEMPLATES: Array<Omit<AchievementDTO, 'unlocked' | 'unlockedAt' | 'progress' | 'target'> & { target: number }> = [
  { id: 'first-mock-exam', title: 'First Mock Exam', description: 'Complete your first mock exam.', icon: '📝', category: 'exam', target: 1 },
  { id: 'seven-day-streak', title: '7-Day Streak', description: 'Maintain a 7-day study streak.', icon: '🔥', category: 'streak', target: 7 },
  { id: 'hundred-questions-solved', title: '100 Questions Solved', description: 'Solve 100 questions across study sessions.', icon: '💡', category: 'practice', target: 100 },
  { id: 'ninety-percent-mock-score', title: '90% Mock Score', description: 'Achieve a 90% mock exam score.', icon: '⭐', category: 'exam', target: 90 },
  { id: 'finish-first-module', title: 'Finish First Module', description: 'Complete your first module.', icon: '📚', category: 'module', target: 1 },
  { id: 'complete-revision-queue', title: 'Complete Revision Queue', description: 'Work through your revision queue.', icon: '🔁', category: 'revision', target: 1 },
  { id: 'ten-mock-exams', title: '10 Mock Exams', description: 'Take 10 mock exams.', icon: '🧪', category: 'exam', target: 10 },
  { id: 'thirty-day-streak', title: '30-Day Streak', description: 'Maintain a 30-day study streak.', icon: '⚡', category: 'streak', target: 30 },
  { id: 'thousand-questions-solved', title: '1000 Questions Solved', description: 'Solve 1000 questions across study sessions.', icon: '🏆', category: 'practice', target: 1000 },
]

function buildProgress(value: number, target: number) {
  if (target <= 0) return 0
  return Math.min(100, Math.round((value / target) * 100))
}

export async function getAchievements(studentId: string): Promise<AchievementSummaryDTO> {
  const cacheKey = getCacheKey('achievement-summary', studentId)
  return instrumentService('AchievementService', 'getAchievements', async () => {
    return withServiceCache(cacheKey, 90_000, async () => {
      const achievements = await evaluateAchievements(studentId)
      const totalUnlocked = achievements.filter((achievement) => achievement.unlocked).length
      const completionPercentage = achievements.length > 0 ? Math.round((totalUnlocked / achievements.length) * 100) : 0

      return {
        totalUnlocked,
        totalAvailable: achievements.length,
        completionPercentage,
        recentAchievements: achievements.filter((achievement) => achievement.unlocked).slice(0, 4),
        inProgressAchievements: achievements.filter((achievement) => !achievement.unlocked).slice(0, 4),
      }
    })
  })
}

export async function evaluateAchievements(studentId: string): Promise<AchievementDTO[]> {
  return instrumentService('AchievementService', 'evaluateAchievements', async () => {
    try {
    const [dashboard, adaptiveData, goals, attempts, moduleProgressRows] = await Promise.all([
      getDashboardSummary(studentId),
      getAdaptiveLearningData(studentId),
      getGoalProgress(studentId),
      examAttemptRepository.listAttempts(studentId),
      progressRepository.findModuleProgressByUser(studentId),
    ])

    const submittedAttempts = attempts.filter((attempt: any) => attempt.status === 'SUBMITTED')
    const completedModules = moduleProgressRows.filter((entry: any) => (entry.percentComplete ?? 0) >= 100).length
    const recentAccuracy = adaptiveData?.performanceSummary?.recentAccuracy ?? 0
    const revisionQueueCount = adaptiveData?.reviewQueue?.length ?? 0
    const questionsSolved = dashboard.questionsSolved
    const streak = dashboard.currentStreak
    const mockExamCount = submittedAttempts.length

    return ACHIEVEMENT_TEMPLATES.map((template) => {
      const unlocked = (() => {
        switch (template.id) {
          case 'first-mock-exam':
            return mockExamCount >= template.target
          case 'seven-day-streak':
            return streak >= template.target
          case 'hundred-questions-solved':
            return questionsSolved >= template.target
          case 'ninety-percent-mock-score':
            return dashboard.averageMockScore >= template.target
          case 'finish-first-module':
            return completedModules >= template.target
          case 'complete-revision-queue':
            return revisionQueueCount >= template.target
          case 'ten-mock-exams':
            return mockExamCount >= template.target
          case 'thirty-day-streak':
            return streak >= template.target
          case 'thousand-questions-solved':
            return questionsSolved >= template.target
          default:
            return false
        }
      })()

      const progressValue = (() => {
        switch (template.id) {
          case 'first-mock-exam':
            return mockExamCount
          case 'seven-day-streak':
            return streak
          case 'hundred-questions-solved':
            return questionsSolved
          case 'ninety-percent-mock-score':
            return dashboard.averageMockScore
          case 'finish-first-module':
            return completedModules
          case 'complete-revision-queue':
            return revisionQueueCount
          case 'ten-mock-exams':
            return mockExamCount
          case 'thirty-day-streak':
            return streak
          case 'thousand-questions-solved':
            return questionsSolved
          default:
            return 0
        }
      })()

      return {
        id: template.id,
        title: template.title,
        description: template.description,
        icon: template.icon,
        category: template.category,
        unlocked,
        unlockedAt: unlocked ? new Date().toISOString() : null,
        progress: buildProgress(progressValue, template.target),
        target: template.target,
      }
    })
  } catch {
    return ACHIEVEMENT_TEMPLATES.map((template) => ({
      id: template.id,
      title: template.title,
      description: template.description,
      icon: template.icon,
      category: template.category,
      unlocked: false,
      unlockedAt: null,
      progress: 0,
      target: template.target,
    }))
  }
  })
}
