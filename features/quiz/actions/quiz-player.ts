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
  const topicProgress = await getTopicProgress(studentId, quiz.topicId);

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
    questions: (quiz.quizQuestions ?? [])
      .map((entry) => entry.question)
      .filter(Boolean)
      .map((question) => ({
        id: question.id,
        question: question.question,
        optionA: question.optionA,
        optionB: question.optionB,
        optionC: question.optionC,
        optionD: question.optionD,
        correctAnswer: question.correctAnswer,
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

  const questions = (quiz.quizQuestions ?? []).map((entry) => entry.question);
  const correctAnswers = questions.filter((question) => question.correctAnswer === (answers[question.id] ?? "")).length;
  const totalQuestions = questions.length;
  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const passed = percentage >= quiz.passingScore;
  const durationMinutes = Math.max(1, Math.ceil((Date.now() - startedAt) / 60000));

  const topicProgress = await prisma.topicProgress.findUnique({
    where: {
      studentId_topicId: {
        studentId,
        topicId: quiz.topicId,
      },
    },
  });

  await prisma.topicProgress.upsert({
    where: {
      studentId_topicId: {
        studentId,
        topicId: quiz.topicId,
      },
    },
    update: {
      status: passed ? "COMPLETED" : "IN_PROGRESS",
      score: percentage,
      timeSpentMinutes: (topicProgress?.timeSpentMinutes ?? 0) + durationMinutes,
      completedAt: passed ? new Date() : topicProgress?.completedAt ?? null,
      lastVisitedAt: new Date(),
    },
    create: {
      studentId,
      topicId: quiz.topicId,
      status: passed ? "COMPLETED" : "IN_PROGRESS",
      score: percentage,
      timeSpentMinutes: durationMinutes,
      completedAt: passed ? new Date() : null,
      lastVisitedAt: new Date(),
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
