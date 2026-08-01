import type { Question, QuestionFilter } from "@/types/ai";

const questions: Question[] = [
  {
    id: "q-corro-1",
    question: "Which material is most resistant to corrosion in a humid environment?",
    difficulty: "Hard",
    module: "DGCA Module 5",
    topic: "Corrosion",
    standard: "DGCA",
    status: "Unanswered",
    isBookmarked: false,
    recommended: true,
  },
  {
    id: "q-mats-2",
    question: "What is the primary function of aircraft materials in load-bearing structures?",
    difficulty: "Medium",
    module: "EASA Module 6",
    topic: "Aircraft Materials",
    standard: "EASA",
    status: "Answered",
    isBookmarked: true,
    lastAttemptedAt: "2026-07-29T12:00:00.000Z",
    recommended: false,
  },
  {
    id: "q-sys-3",
    question: "Why does a hydraulic system require regular inspection?",
    difficulty: "Easy",
    module: "Both Modules",
    topic: "Hydraulic Systems",
    standard: "Both",
    status: "Unanswered",
    isBookmarked: false,
    recommended: true,
  },
];

export function getPlaceholderQuestions(): Question[] {
  return questions.map((question) => ({ ...question }));
}

export function filterQuestions(items: Question[], filter: QuestionFilter = {}): Question[] {
  const normalized = filter.search?.trim().toLowerCase() ?? "";
  return items.filter((question) => {
    const matchesSearch = normalized.length === 0 || [question.question, question.topic, question.module].some((value) => value.toLowerCase().includes(normalized));
    const matchesStandard = !filter.standard || filter.standard === "All" || question.standard === filter.standard || question.standard === "Both";
    const matchesModule = !filter.module || question.module.toLowerCase().includes(filter.module.toLowerCase());
    const matchesTopic = !filter.topic || question.topic.toLowerCase().includes(filter.topic.toLowerCase());
    const matchesDifficulty = !filter.difficulty || question.difficulty === filter.difficulty;
    const matchesStatus = !filter.status || filter.status === "All" || question.status === filter.status;
    const matchesBookmarked = !filter.bookmarkedOnly || question.isBookmarked;
    const matchesRecent = !filter.recentOnly || Boolean(question.lastAttemptedAt);
    const matchesRecommended = !filter.recommendedOnly || question.recommended;

    return matchesSearch && matchesStandard && matchesModule && matchesTopic && matchesDifficulty && matchesStatus && matchesBookmarked && matchesRecent && matchesRecommended;
  });
}
