export type StudyPlannerDTO = {
  estimatedStudyMinutes: number
  revisionTasks: Array<{
    id: string
    title: string
    detail: string
  }>
  practiceTasks: Array<{
    id: string
    title: string
    detail: string
  }>
  mockExamTask: {
    id: string
    title: string
    detail: string
  } | null
  weakTopicTasks: Array<{
    id: string
    title: string
    detail: string
  }>
  generatedAt: string
}

export type ContinueLearningDTO = {
  lastModule: string | null
  lastLesson: string | null
  lastQuiz: string | null
  lastMockExam: number | null
  resumeUrl: string
}
