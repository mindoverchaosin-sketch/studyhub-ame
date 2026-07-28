"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getQuizAnalytics, getQuizWithQuestions, submitQuizAttempt } from "@/server/services/quiz.service";
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
  const analytics = await getQuizAnalytics(studentId, quizId);

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
    analytics,
  };
}

export async function submitQuizAction(
  quizId: string,
  answers: Record<string, string>,
  startedAt: number,
  options?: {
    questionStates?: Record<string, { markedForReview?: boolean; bookmarked?: boolean; skipped?: boolean }>;
    mode?: "practice" | "mock";
    durationMinutes?: number;
    timedOut?: boolean;
  },
) {
  const studentId = await requireStudentId();

  return submitQuizAttempt({
    studentId,
    quizId,
    answers,
    startedAt,
    mode: options?.mode ?? "practice",
    durationMinutes: options?.durationMinutes ?? 1,
    timedOut: options?.timedOut ?? false,
    questionStates: options?.questionStates,
  });
}
