import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getQuestionsByTopic } from "@/server/services/question.service";
import { getQuizByTopic } from "@/server/services/quiz.service";
import { getResourcesByTopic } from "@/server/services/resource.service";
import { getStudentProgress, getTopicProgress } from "@/server/services/progress.service";
import { getTopicBySlug, getTopicsBySection } from "@/server/services/topic.service";
import { getProgressStatusLabel } from "@/features/topics/utils/topic-learning";
import type { TopicLearningPageData } from "@/features/topics/types";

async function requireStudentId() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user.id;
}

export async function getTopicLearningPageData(topicSlug: string): Promise<TopicLearningPageData | null> {
  const studentId = await requireStudentId();
  const topic = await getTopicBySlug(topicSlug);

  if (!topic) {
    return null;
  }

  const [topicProgress, resources, questions, quiz] = await Promise.all([
    getTopicProgress(studentId, topic.id),
    getResourcesByTopic(topic.id),
    getQuestionsByTopic(topic.id),
    getQuizByTopic(topic.id),
  ]);

  const learningModule = topic.moduleId ? await prisma.module.findUnique({ where: { id: topic.moduleId } }) : null;
  const course = learningModule ? await prisma.course.findUnique({ where: { id: learningModule.courseId } }) : null;
  const allTopicsInSection = learningModule ? await prisma.lesson.findMany({ where: { moduleId: learningModule.id }, orderBy: { displayOrder: 'asc' } }) : [];
  const topicIndex = allTopicsInSection.findIndex((item) => item.id === topic.id);

  const previousTopic = topicIndex > 0 ? { slug: allTopicsInSection[topicIndex - 1].slug, title: allTopicsInSection[topicIndex - 1].title } : null;
  const nextTopic = topicIndex >= 0 && topicIndex < allTopicsInSection.length - 1 ? { slug: allTopicsInSection[topicIndex + 1].slug, title: allTopicsInSection[topicIndex + 1].title } : null;

  return {
    topic: {
      id: topic.id,
      title: topic.title,
      slug: topic.slug,
      description: topic.description,
      estimatedMinutes: topic.estimatedMinutes,
      difficulty: topic.difficulty,
    },
    breadcrumb: {
      courseTitle: course?.title ?? "Course",
      courseSlug: course?.slug ?? "",
      moduleTitle: learningModule?.title ?? "Module",
      moduleSlug: learningModule?.slug ?? "",
    },
    resources: resources.map((resource) => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      type: resource.type,
      url: resource.url,
    })),
    questions: questions.map((question) => ({
      id: question.id,
      question: question.question,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
    })),
    quiz: quiz
      ? {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          passingScore: quiz.passingScore,
          timeLimitMinutes: quiz.timeLimitMinutes,
        }
      : null,
    progress: {
      status: getProgressStatusLabel(topicProgress?.status ?? "NOT_STARTED"),
      timeSpentMinutes: topicProgress?.timeSpentMinutes ?? 0,
      score: topicProgress?.score ?? null,
      completed: topicProgress?.status === "COMPLETED",
    },
    navigation: {
      previousTopic,
      nextTopic,
    },
  };
}
