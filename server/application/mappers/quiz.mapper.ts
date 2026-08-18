import type { QuizWithQuestionBanksEntity, QuizWithQuestionBanksAndQuestionsEntity } from '../../infrastructure/entities/quiz.entity'
import type { QuizWithQuestionBanksAndQuestionsWithModuleEntity } from '../../infrastructure/entities/quiz.entity'
import type { QuizDTO } from '../dto/quiz.dto'
import type { QuestionBankReferenceDTO } from '../dto/question-bank.dto'
import { mapQuestionEntityToDTO } from './question.mapper'

export function mapQuizEntityToDTO(quiz: QuizWithQuestionBanksEntity, topicId?: string): QuizDTO {
  return {
    id: quiz.id,
    moduleId: quiz.moduleId,
    title: quiz.title,
    description: quiz.description,
    passingScore: quiz.passingScore,
    timeLimitMinutes: quiz.timeLimitMinutes,
    status: quiz.status,
    publishedAt: quiz.publishedAt,
    createdAt: quiz.createdAt,
    updatedAt: quiz.updatedAt,
    questionBanks: quiz.questionBanks.map((bank): QuestionBankReferenceDTO => ({
      id: bank.id,
      title: bank.title,
      description: bank.description,
    })),
    topicId: topicId ?? quiz.moduleId,
  }
}

export function mapQuizWithQuestionsEntityToDTO(
  quiz: QuizWithQuestionBanksAndQuestionsEntity | QuizWithQuestionBanksAndQuestionsWithModuleEntity,
  topicId?: string,
): QuizDTO {
  return {
    ...mapQuizEntityToDTO(quiz, topicId),
    questions: quiz.questionBanks.flatMap((bank: any) => bank.questions.map(mapQuestionEntityToDTO)),
  }
}
