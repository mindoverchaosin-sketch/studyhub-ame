export type MockTestStatus = "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED";
export type MockExamType = "DGCA" | "EASA";
export type QuestionType = "mcq" | "multiple-choice" | "true-false";

export interface MockQuestion {
  id: string;
  prompt: string;
  type: QuestionType;
  topic: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  options: string[];
  correctOption: number;
  explanation: string;
}

export interface MockTestTemplate {
  id: string;
  title: string;
  description: string;
  examType: MockExamType;
  questionCount: number;
  durationMinutes: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  passingScore: number;
  status: MockTestStatus;
  attempts: number;
  bestScore: number;
  lastAttempted: string;
  topicCoverage: string[];
}

export interface MockAttemptSummary {
  id: string;
  title: string;
  date: string;
  score: number;
  percentage: number;
  durationMinutes: number;
  passed: boolean;
  trend: "up" | "down" | "steady";
}

export const mockExamTemplates: MockTestTemplate[] = [
  {
    id: "demo-dgca-01",
    title: "DGCA Airframes Fundamentals",
    description: "A structured practice set focused on aircraft structures, systems, and practical reasoning.",
    examType: "DGCA",
    questionCount: 12,
    durationMinutes: 30,
    difficulty: "Intermediate",
    passingScore: 70,
    status: "IN_PROGRESS",
    attempts: 2,
    bestScore: 82,
    lastAttempted: "2 days ago",
    topicCoverage: ["Aircraft Materials", "Corrosion", "Hardware"],
  },
  {
    id: "demo-easa-01",
    title: "EASA Systems Revision",
    description: "A high-yield mock test for systems, maintenance thinking, and scenario-based recall.",
    examType: "EASA",
    questionCount: 15,
    durationMinutes: 40,
    difficulty: "Advanced",
    passingScore: 75,
    status: "NOT_STARTED",
    attempts: 0,
    bestScore: 0,
    lastAttempted: "Not attempted",
    topicCoverage: ["Hydraulics", "Electrical", "Fuel Systems"],
  },
  {
    id: "demo-dgca-02",
    title: "DGCA Human Factors Drill",
    description: "Practice the judgment and operational awareness themes most candidates miss under pressure.",
    examType: "DGCA",
    questionCount: 10,
    durationMinutes: 20,
    difficulty: "Beginner",
    passingScore: 65,
    status: "COMPLETED",
    attempts: 1,
    bestScore: 90,
    lastAttempted: "Last week",
    topicCoverage: ["Decision Making", "Workload", "Fatigue"],
  },
];

export const mockExamQuestions: MockQuestion[] = [
  {
    id: "q-1",
    prompt: "Which material is commonly used for lightweight aircraft structures due to its excellent strength-to-weight ratio?",
    type: "mcq",
    topic: "Aircraft Materials",
    difficulty: "Beginner",
    options: ["Steel", "Aluminum alloy", "Copper", "Lead"],
    correctOption: 1,
    explanation: "Aluminum alloys are widely used in aircraft structures because they provide a strong yet lightweight solution.",
  },
  {
    id: "q-2",
    prompt: "Corrosion in aircraft structures is most likely to occur near which area?",
    type: "mcq",
    topic: "Corrosion",
    difficulty: "Intermediate",
    options: ["Dry cabin panels", "High humidity and salt exposure", "Interior insulation", "Painted exterior surfaces only"],
    correctOption: 1,
    explanation: "Corrosion is accelerated in humid and salt-exposed conditions, especially around fasteners and joints.",
  },
  {
    id: "q-3",
    prompt: "A fastener that resists vibration loosening is best described as which type?",
    type: "mcq",
    topic: "Hardware",
    difficulty: "Intermediate",
    options: ["Plain washer", "Self-locking nut", "Cable tie", "Rivet sleeve"],
    correctOption: 1,
    explanation: "Self-locking nuts are used where vibration can loosen standard fasteners over time.",
  },
  {
    id: "q-4",
    prompt: "Hydraulic systems are usually preferred when a system requires which property?",
    type: "mcq",
    topic: "Hydraulics",
    difficulty: "Beginner",
    options: ["Low force transfer", "High power density", "No maintenance", "Manual-only operation"],
    correctOption: 1,
    explanation: "Hydraulic systems are strong choices for applications that require compact but high-force transmission.",
  },
  {
    id: "q-5",
    prompt: "A common reason for electrical fault isolation is to prevent which issue?",
    type: "mcq",
    topic: "Electrical",
    difficulty: "Intermediate",
    options: ["Excessive lubrication", "Fire propagation", "Under-voltage", "Fuel contamination"],
    correctOption: 1,
    explanation: "Electrical fault isolation reduces the chance of damage spreading through a system and improves safety.",
  },
  {
    id: "q-6",
    prompt: "Which factor most strongly affects decision quality under workload pressure?",
    type: "mcq",
    topic: "Decision Making",
    difficulty: "Advanced",
    options: ["Ignoring checklists", "Prioritizing safety", "Rushing to completion", "Avoiding communication"],
    correctOption: 1,
    explanation: "Decision quality improves when safety, checklists, and structured communication remain priorities under time pressure.",
  },
  {
    id: "q-7",
    prompt: "Fatigue is most likely to reduce which capability?",
    type: "mcq",
    topic: "Fatigue",
    difficulty: "Beginner",
    options: ["Attention", "Color vision", "Fuel storage", "Weather monitoring"],
    correctOption: 0,
    explanation: "Fatigue reduces attention, situational awareness, and the ability to process information reliably.",
  },
  {
    id: "q-8",
    prompt: "During pre-flight planning, the most reliable approach to reduce human error is to use which method?",
    type: "mcq",
    topic: "Workload",
    difficulty: "Intermediate",
    options: ["Ad-hoc memory", "Checklists and structured review", "Skipping briefing", "Relying on assumptions"],
    correctOption: 1,
    explanation: "Structured checklists reduce omissions and improve consistency during high-pressure tasks.",
  },
];

export const mockAttemptHistory: MockAttemptSummary[] = [
  {
    id: "history-1",
    title: "DGCA Airframes Fundamentals",
    date: "2026-07-26",
    score: 84,
    percentage: 84,
    durationMinutes: 28,
    passed: true,
    trend: "up",
  },
  {
    id: "history-2",
    title: "EASA Systems Revision",
    date: "2026-07-18",
    score: 68,
    percentage: 68,
    durationMinutes: 37,
    passed: false,
    trend: "down",
  },
  {
    id: "history-3",
    title: "DGCA Human Factors Drill",
    date: "2026-07-10",
    score: 90,
    percentage: 90,
    durationMinutes: 18,
    passed: true,
    trend: "steady",
  },
];
