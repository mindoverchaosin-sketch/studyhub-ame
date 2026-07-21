"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getQuizWithQuestions } from "@/server/services/quiz.service";
import { getTopicProgress } from "@/server/services/progress.service";
import { getTopicById } from "@/server/services/topic.service";
import type { QuizPlayerPageData } from "@/features/quiz/types";

async function requireStudentId() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user.id;
}

export async function getQuizPlayerPageData(quizId: string): Promise<QuizPlayerPageData | null> {
  const studentId = await requireStudentId();
  const quiz = await getQuizWithQuestions(quizId);

  if (!quiz) {
    return null;
  }

  const topic = await getTopicById(quiz.topicId);
  const topicProgress = await getTopicProgress(studentId, quiz.lessonId ?? quiz.topicId);

  return {
    quiz: {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      passingScore: quiz.passingScore,
      timeLimitMinutes: quiz.timeLimitMinutes,
      topicId: quiz.topicId,
      topicTitle: topic?.title ?? "Topic",
    },
    questions: (quiz.questions ?? [])
      .map((question) => ({
        id: question.id,
        question: question.question,
        optionA: question.optionA,
        optionB: question.optionB,
        optionC: question.optionC,
        optionD: question.optionD,
        correctAnswer: question.correctAnswer ?? "",
        explanation: question.explanation,
      })),
    topicProgress: {
      status: topicProgress?.status ?? "NOT_STARTED",
      timeSpentMinutes: topicProgress?.timeSpentMinutes ?? 0,
      score: topicProgress?.score ?? null,
    },
  };
}

export async function submitQuizAction(quizId: string, answers: Record<string, string>, startedAt: number) {
  const studentId = await requireStudentId();
  const quiz = await getQuizWithQuestions(quizId);

  if (!quiz) {
    return null;
  }

  const lessonId = quiz.lessonId ?? quiz.topicId;
  const questions = (quiz.questions ?? []).map((question) => ({
    ...question,
    correctAnswer: question.correctAnswer,
  }));
  const correctAnswers = questions.filter((question) => question.correctAnswer === (answers[question.id] ?? "")).length;
  const totalQuestions = questions.length;
  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const passed = percentage >= quiz.passingScore;
  const durationMinutes = Math.max(1, Math.ceil((Date.now() - startedAt) / 60000));

  const topicProgress = await prisma.lessonProgress.findFirst({
    where: {
      userId: studentId,
      lessonId,
    },
  });

  await prisma.lessonProgress.upsert({
    where: {
      userId_lessonId: {
        userId: studentId,
        lessonId,
      },
    },
    update: {
      status: passed ? "COMPLETED" : "IN_PROGRESS",
      percentComplete: percentage,
    },
    create: {
      userId: studentId,
      lessonId,
      status: passed ? "COMPLETED" : "IN_PROGRESS",
      percentComplete: percentage,
    },
  });

  return {
    score: percentage,
    correct: correctAnswers,
    incorrect: totalQuestions - correctAnswers,
    passed,
    durationMinutes,
  };
}
