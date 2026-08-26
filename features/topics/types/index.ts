export type TopicLearningResource = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  isPremium: boolean;
};

export type TopicLearningQuestion = {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
};

export type TopicLearningPageData = {
  topic: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    estimatedMinutes: number | null;
    difficulty: string;
  };
  breadcrumb: {
    courseTitle: string;
    courseSlug: string;
    moduleTitle: string;
    moduleSlug: string;
  };
  resources: TopicLearningResource[];
  questions: TopicLearningQuestion[];
  quiz: {
    id: string;
    title: string;
    description: string | null;
    passingScore: number;
    timeLimitMinutes: number | null;
  } | null;
  progress: {
    status: string;
    timeSpentMinutes: number;
    score: number | null;
    completed: boolean;
  };
  navigation: {
    previousTopic: { slug: string; title: string } | null;
    nextTopic: { slug: string; title: string } | null;
  };
};
