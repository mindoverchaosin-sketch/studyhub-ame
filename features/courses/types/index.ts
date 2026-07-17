export type CourseBrowserCourse = {
  id: string;
  title: string;
  description: string | null;
  examType: string;
  moduleCount: number;
  progressPercent: number;
  completedTopics: number;
  totalTopics: number;
};

export type CourseBrowserModule = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  sectionCount: number;
  topicCount: number;
  completedTopics: number;
  progressPercent: number;
  status: "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED";
};

export type CourseBrowserSection = {
  id: string;
  title: string;
  order: number;
  topicCount: number;
  completedTopics: number;
  progressPercent: number;
};

export type CourseBrowserTopic = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED";
};

export type CourseBrowserCourseDetail = {
  course: {
    id: string;
    title: string;
    description: string | null;
    examType: string;
    slug: string;
  };
  modules: CourseBrowserModule[];
};

export type CourseBrowserModuleDetail = {
  course: {
    id: string;
    title: string;
    slug: string;
  };
  module: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
  };
  sections: CourseBrowserSection[];
  topics: CourseBrowserTopic[];
};
