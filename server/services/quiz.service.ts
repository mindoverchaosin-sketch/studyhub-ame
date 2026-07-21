import type { QuizDTO } from '@/server/application/dto/quiz.dto'
import { quizRepository } from '@/server/repositories/quiz.repository'
import { mapQuizEntityToDTO, mapQuizWithQuestionsEntityToDTO } from '@/server/application/mappers/quiz.mapper'

/**
 * QuizService
 * Handles quiz-related database operations
 */

export async function getQuizByTopic(topicId: string): Promise<QuizDTO | null> {
  const quiz = await quizRepository.findByLesson(topicId)
  return quiz ? mapQuizEntityToDTO(quiz, topicId) : null
}

export async function getQuizById(id: string): Promise<QuizDTO | null> {
  const quiz = await quizRepository.findById(id)
  return quiz ? mapQuizEntityToDTO(quiz) : null
}

export async function getQuizWithQuestions(id: string): Promise<QuizDTO | null> {
  const quiz = await quizRepository.findWithQuestions(id)
  return quiz ? mapQuizWithQuestionsEntityToDTO(quiz) : null
}

export async function getPublishedQuizzes(): Promise<QuizDTO[]> {
  return (await quizRepository.findAllPublished()).map((q) => mapQuizEntityToDTO(q))
}

export async function getQuizCount(): Promise<number> {
  return quizRepository.countAll()
}
