export type ExamTemplateDTO = {
  id: string
  name: string
  description?: string
  questionBankId?: string
  moduleId?: string
  courseId?: string
  durationMinutes: number
  questionCount: number
  passingPercentage: number
  shuffleQuestions: boolean
  shuffleAnswers: boolean
  negativeMarkingEnabled: boolean
  active: boolean
  createdAt: string
  updatedAt: string
}
