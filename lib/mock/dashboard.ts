export interface LearningModule {
  id: string;
  title: string;
  slug: string;
}

export interface LearningLesson {
  id: string;
  title: string;
  description: string;
  moduleId: string;
  href: string;
}

export interface LearningProgress {
  id: string;
  moduleId: string;
  lessonId: string;
  progress: number;
  remainingTime: string;
  lastStudied: string;
}

export interface ContinueLearningItem {
  module: LearningModule;
  lesson: LearningLesson;
  progress: LearningProgress;
}

export const dashboardContinueLearningMock: ContinueLearningItem[] = [
  {
    module: {
      id: "module-airframes",
      title: "Module 04",
      slug: "airframes-systems",
    },
    lesson: {
      id: "lesson-airframes",
      title: "Airframes & Systems",
      description: "Review structural components, inspection principles, and maintenance considerations.",
      moduleId: "module-airframes",
      href: "/modules",
    },
    progress: {
      id: "progress-airframes",
      moduleId: "module-airframes",
      lessonId: "lesson-airframes",
      progress: 72,
      remainingTime: "12 min left",
      lastStudied: "Today · 08:30",
    },
  },
  {
    module: {
      id: "module-navigation",
      title: "Module 02",
      slug: "navigation-procedures",
    },
    lesson: {
      id: "lesson-navigation",
      title: "Navigation Procedures",
      description: "Revisit radio navigation and en-route decision-making with a concise recap.",
      moduleId: "module-navigation",
      href: "/quiz",
    },
    progress: {
      id: "progress-navigation",
      moduleId: "module-navigation",
      lessonId: "lesson-navigation",
      progress: 48,
      remainingTime: "21 min left",
      lastStudied: "Yesterday · 19:10",
    },
  },
];
