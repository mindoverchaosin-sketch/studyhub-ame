export type DashboardSummaryDTO = {
  readinessScore: number
  currentStreak: number
  longestStreak: number
  modulesCompleted: number
  totalModules: number
  questionsSolved: number
  mockExamsTaken: number
  averageMockScore: number
  revisionQueueCount: number
  weeklyStudyMinutes: number
}

export type DashboardDTO = {
  welcome: {
    studentName: string
    targetExam: string | null
  }
  continueLearning: Array<{
    id: string
    lesson: {
      id: string
      title: string
      description: string | null
      href: string
    }
    module: {
      title: string
      href: string
    }
    progress: {
      progress: number
      remainingTime: string
      lastStudied: string
    }
  }>
  progress: {
    courseCompletion: number
    moduleCompletion: number
    lessonCompletion: number
    quizScore: number
  }
  dailyGoal: {
    minutesStudiedToday: number
    dailyTarget: number
    remainingTime: number
    weeklyStudyGoalMinutes: number
  }
  studyStreak: {
    currentStreak: number
    longestStreak: number
    weeklyCalendar: string[]
  }
  recentActivity: Array<{
    title: string
    detail: string
    time: string
  }>
}
