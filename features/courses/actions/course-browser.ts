import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { getAllCourses, getCourseBySlug } from "@/server/services/course.service";
import { getModulesByCourse, getModuleBySlug, getModuleWithSections } from "@/server/services/module.service";
import { getStudentProgress } from "@/server/services/progress.service";
import { getTopicsBySection } from "@/server/services/topic.service";
import { getProgressPercent, getStatusFromPercent } from "@/features/courses/utils/course-browser";
import type { CourseBrowserCourse, CourseBrowserCourseDetail, CourseBrowserModuleDetail } from "@/features/courses/types";

async function requireStudentId() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user.id;
}

export async function getCourseBrowserData(): Promise<{ courses: CourseBrowserCourse[] }> {
  const studentId = await requireStudentId();
  const [courses, progressRows] = await Promise.all([getAllCourses(), getStudentProgress(studentId)]);
  const completedTopicIds = new Set(progressRows.filter((row) => row.status === "COMPLETED").map((row) => row.topicId));

  const courseSummaries = await Promise.all(
    courses.map(async (course) => {
      const modules = await getModulesByCourse(course.id);
      let completedTopics = 0;
      let totalTopics = 0;

      for (const courseModule of modules) {
        const moduleWithSections = await getModuleWithSections(courseModule.id);
        for (const section of moduleWithSections?.sections ?? []) {
          const topics = await getTopicsBySection(section.id);
          totalTopics += topics.length;
          completedTopics += topics.filter((topic) => completedTopicIds.has(topic.id)).length;
        }
      }

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        examType: course.examType,
        moduleCount: modules.length,
        progressPercent: getProgressPercent(completedTopics, totalTopics),
        completedTopics,
        totalTopics,
      } satisfies CourseBrowserCourse;
    })
  );

  return { courses: courseSummaries };
}

export async function getCourseDetailPageData(courseSlug: string): Promise<CourseBrowserCourseDetail | null> {
  const studentId = await requireStudentId();
  const course = await getCourseBySlug(courseSlug);

  if (!course) {
    notFound();
  }

  const [modules, progressRows] = await Promise.all([getModulesByCourse(course.id), getStudentProgress(studentId)]);
  const completedTopicIds = new Set(progressRows.filter((row) => row.status === "COMPLETED").map((row) => row.topicId));

  const moduleSummaries = await Promise.all(
    modules.map(async (module) => {
      const moduleWithSections = await getModuleWithSections(module.id);
      let completedTopics = 0;
      let totalTopics = 0;

      for (const section of moduleWithSections?.sections ?? []) {
        const topics = await getTopicsBySection(section.id);
        totalTopics += topics.length;
        completedTopics += topics.filter((topic) => completedTopicIds.has(topic.id)).length;
      }

      const progressPercent = getProgressPercent(completedTopics, totalTopics);

      return {
        id: module.id,
        title: module.title,
        slug: module.slug,
        description: module.description,
        sectionCount: moduleWithSections?.sections?.length ?? 0,
        topicCount: totalTopics,
        completedTopics,
        progressPercent,
        status: getStatusFromPercent(progressPercent),
      };
    })
  );

  return {
    course: {
      id: course.id,
      title: course.title,
      description: course.description,
      examType: course.examType,
      slug: course.slug,
    },
    modules: moduleSummaries,
  };
}

export async function getModuleDetailPageData(courseSlug: string, moduleSlug: string): Promise<CourseBrowserModuleDetail | null> {
  const studentId = await requireStudentId();
  const [course, moduleRecord] = await Promise.all([getCourseBySlug(courseSlug), getModuleBySlug(moduleSlug)]);

  if (!course || !moduleRecord || moduleRecord.courseId !== course.id) {
    notFound();
  }

  const [moduleWithSections, progressRows] = await Promise.all([getModuleWithSections(moduleRecord.id), getStudentProgress(studentId)]);
  const completedTopicIds = new Set(progressRows.filter((row) => row.status === "COMPLETED").map((row) => row.topicId));

  const sections = await Promise.all(
    (moduleWithSections?.sections ?? []).map(async (section) => {
      const topics = await getTopicsBySection(section.id);
      const completedTopics = topics.filter((topic) => completedTopicIds.has(topic.id)).length;
      const progressPercent = getProgressPercent(completedTopics, topics.length);

      return {
        id: section.id,
        title: section.title,
        order: section.order,
        topicCount: topics.length,
        completedTopics,
        progressPercent,
      };
    })
  );

  const topics = sections.flatMap((section) => {
    return [];
  });

  const topicDetails = await Promise.all(
    (moduleWithSections?.sections ?? []).flatMap((section) => {
      return [section.id];
    })
  );

  const resolvedTopics: CourseBrowserModuleDetail["topics"] = [];

  for (const section of moduleWithSections?.sections ?? []) {
    const topicsForSection = await getTopicsBySection(section.id);
    for (const topic of topicsForSection) {
      const topicStatus = completedTopicIds.has(topic.id) ? "COMPLETED" : "NOT_STARTED";
      resolvedTopics.push({
        id: topic.id,
        title: topic.title,
        slug: topic.slug,
        description: topic.description,
        status: topicStatus,
      });
    }
  }

  return {
    course: {
      id: course.id,
      title: course.title,
      slug: course.slug,
    },
    module: {
      id: moduleRecord.id,
      title: moduleRecord.title,
      slug: moduleRecord.slug,
      description: moduleRecord.description,
    },
    sections,
    topics: resolvedTopics,
  };
}
