export type ModuleStatus = "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED" | "LOCKED";
export type ModuleExamType = "DGCA" | "EASA";

export interface ModuleLesson {
  id: string;
  slug: string;
  title: string;
  duration: string;
  completed: boolean;
  locked?: boolean;
  summary?: string;
  keyPoints?: string[];
  notes?: string[];
  resources?: string[];
}

export interface ModuleResource {
  id: string;
  title: string;
  type: "PDF" | "Video" | "Note";
}

export interface ModuleQuiz {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}

export interface ModuleData {
  id: string;
  number: number;
  slug: string;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedHours: number;
  progress: number;
  lessonsCount: number;
  resourcesCount: number;
  status: ModuleStatus;
  examType: ModuleExamType;
  objectives: string[];
  lessons: ModuleLesson[];
  resources: ModuleResource[];
  quizzes: ModuleQuiz[];
  lastStudied: string;
  summary: string;
}

export const mockModules: ModuleData[] = [
  {
    id: "module-6",
    number: 6,
    slug: "airframes-and-systems",
    title: "Airframes and Systems",
    description: "Understand structural design, aircraft systems, and practical maintenance principles.",
    difficulty: "Intermediate",
    estimatedHours: 10,
    progress: 72,
    lessonsCount: 8,
    resourcesCount: 5,
    status: "IN_PROGRESS",
    examType: "DGCA",
    objectives: ["Identify major airframe components", "Explain primary systems", "Interpret maintenance documentation"],
    lessons: [
      { id: "lesson-1", slug: "structural-layout", title: "Structural layout", duration: "18 min", completed: true, summary: "Learn how major structural sections connect and support the aircraft." },
      { id: "lesson-2", slug: "hydraulic-systems", title: "Hydraulic systems", duration: "22 min", completed: true, summary: "Trace the flow of pressure and control through the hydraulic network." },
      { id: "lesson-3", slug: "fuel-and-electrical-systems", title: "Fuel and electrical systems", duration: "26 min", completed: false, summary: "Review the integration of power distribution and fuel management." },
    ],
    resources: [
      { id: "resource-1", title: "Airframe fundamentals", type: "PDF" },
      { id: "resource-2", title: "Systems overview", type: "Video" },
    ],
    quizzes: [
      { id: "quiz-1", title: "Systems recap", difficulty: "Beginner" },
      { id: "quiz-2", title: "Maintenance scenario", difficulty: "Advanced" },
    ],
    lastStudied: "Today · 08:30",
    summary: "A strong foundation for understanding aircraft structures and the systems that support safe operations.",
  },
  {
    id: "module-7",
    number: 7,
    slug: "navigation-procedures",
    title: "Navigation Procedures",
    description: "Explore navigation principles, radio aids, and procedural awareness for exams.",
    difficulty: "Advanced",
    estimatedHours: 12,
    progress: 100,
    lessonsCount: 9,
    resourcesCount: 4,
    status: "COMPLETED",
    examType: "EASA",
    objectives: ["Apply navigation principles", "Recognize key procedures", "Review exam-style scenarios"],
    lessons: [
      { id: "lesson-4", slug: "en-route-planning", title: "En-route planning", duration: "20 min", completed: true, summary: "Plan efficient routes and recognize key checkpoints." },
      { id: "lesson-5", slug: "approach-procedures", title: "Approach procedures", duration: "24 min", completed: true, summary: "Practice reading standard approach patterns and restrictions." },
    ],
    resources: [
      { id: "resource-3", title: "Procedure summary", type: "Note" },
      { id: "resource-4", title: "Navigation walkthrough", type: "Video" },
    ],
    quizzes: [
      { id: "quiz-3", title: "Navigation challenge", difficulty: "Intermediate" },
    ],
    lastStudied: "Yesterday · 19:10",
    summary: "Covers essential navigation concepts and the procedural thinking expected in assessments.",
  },
  {
    id: "module-8",
    number: 8,
    slug: "human-factors",
    title: "Human Factors",
    description: "Build confidence around decision-making, workload management, and human error.",
    difficulty: "Beginner",
    estimatedHours: 8,
    progress: 0,
    lessonsCount: 7,
    resourcesCount: 3,
    status: "NOT_STARTED",
    examType: "DGCA",
    objectives: ["Recognize learning factors", "Discuss fatigue and workload", "Apply human factors principles"],
    lessons: [
      { id: "lesson-6", slug: "introduction-to-human-factors", title: "Introduction to human factors", duration: "16 min", completed: false, summary: "Discover the habits that improve judgment and reduce operational risk." },
    ],
    resources: [
      { id: "resource-5", title: "Human factors primer", type: "PDF" },
    ],
    quizzes: [
      { id: "quiz-4", title: "Human factors basics", difficulty: "Beginner" },
    ],
    lastStudied: "Not started yet",
    summary: "An introductory module designed to build judgment and awareness for operational scenarios.",
  },
  {
    id: "module-9",
    number: 9,
    slug: "meteorology-principles",
    title: "Meteorology Principles",
    description: "A locked placeholder module for later release with richer advanced content.",
    difficulty: "Advanced",
    estimatedHours: 14,
    progress: 0,
    lessonsCount: 6,
    resourcesCount: 2,
    status: "LOCKED",
    examType: "EASA",
    objectives: ["Preview advanced meteorological topics", "Prepare for future study"],
    lessons: [],
    resources: [],
    quizzes: [],
    lastStudied: "Locked",
    summary: "This module will unlock as new study content is published.",
  },
];
