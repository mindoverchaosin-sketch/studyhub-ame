export type AchievementDTO = {
  id: string
  title: string
  description: string
  icon: string
  category: string
  unlocked: boolean
  unlockedAt: string | null
  progress: number
  target: number
}

export type AchievementSummaryDTO = {
  totalUnlocked: number
  totalAvailable: number
  completionPercentage: number
  recentAchievements: AchievementDTO[]
  inProgressAchievements: AchievementDTO[]
}
