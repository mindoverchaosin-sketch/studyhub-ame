export type QuizQuestionItem = {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation?: string | null;
};

export type QuizPlayerPageData = {
  quiz: {
    id: string;
    title: string;
    description: string | null;
    passingScore: number;
    timeLimitMinutes: number | null;
    topicId: string;
    topicTitle: string;
  };
  questions: QuizQuestionItem[];
  topicProgress: {
    status: string;
    timeSpentMinutes: number;
    score: number | null;
  };
};
