import { requireStudent } from "@/auth";
import { getStudentQuestionsByBank } from "@/server/services/student-question-bank.service";
import { getQuizByTopic } from "@/server/services/quiz.service";
import { getResourcesByTopic } from "@/server/services/resource.service";
import { getTopicProgress } from "@/server/services/progress.service";
import { getTopicBySlug } from "@/server/services/topic.service";
import { getModuleById, getModuleWithSections, getPublishedModuleAccessContextById } from '@/server/services/module.service'
import { getCourseById } from '@/server/services/course.service'
import { contentAccessService } from '@/server/services/content-access.service'
import { getProgressStatusLabel } from "@/features/topics/utils/topic-learning";
import type { TopicLearningPageData } from "@/features/topics/types";

export async function getTopicLearningPageData(topicSlug: string): Promise<TopicLearningPageData | null> {
  const session = await requireStudent()
  const studentId = session.user.id
  if (!studentId) return null
  const topic = await getTopicBySlug(topicSlug);

  if (!topic || !topic.moduleId) {
    return null;
  }

  const accessContext = await getPublishedModuleAccessContextById(topic.moduleId)
  if (!accessContext) return null

  const [courseAccess, moduleAccess] = await Promise.all([
    contentAccessService.canAccessCourse(studentId, accessContext.courseIsPremium),
    contentAccessService.canAccessModule(studentId, accessContext.moduleIsPremium),
  ])
  if (!courseAccess.allowed || !moduleAccess.allowed) return null

  const [topicProgress, resources, questions, quiz, learningModule, course, moduleWithSections] = await Promise.all([
    getTopicProgress(studentId, topic.id),
    getResourcesByTopic(topic.id),
    getStudentQuestionsByBank(studentId, topic.id),
    getQuizByTopic(topic.id),
    getModuleById(topic.moduleId),
    getCourseById(accessContext.courseId),
    getModuleWithSections(topic.moduleId),
  ]);

  const allTopicsInSection = moduleWithSections ? moduleWithSections.sections.map((s) => ({ id: s.id, slug: s.slug, title: s.title })) : [];
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
      isPremium: resource.isPremium,
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
