import type { Quiz, QuestionBank, Question } from '@prisma/client'

export type QuizEntity = Quiz
export type QuizWithQuestionBanksEntity = Quiz & { questionBanks: QuestionBank[] }
export type QuizWithQuestionsEntity = Quiz & { questions: Question[] }
export type QuizWithQuestionBanksAndQuestionsEntity = Quiz & {
  questionBanks: Array<QuestionBank & { questions: Question[] }>
}

export type QuizWithQuestionBanksAndQuestionsWithModuleEntity = Quiz & {
  module: {
    lessons: Array<{ id: string }>
  }
  questionBanks: Array<QuestionBank & { questions: Question[] }>
}
