export type ModuleStatus = "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED" | "LOCKED";

export interface Module {
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
  summary: string;
  lastStudied: string;
}

export interface ModuleLesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
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

export interface ModuleDetail extends Module {
  objectives: string[];
  lessons: ModuleLesson[];
  resources: ModuleResource[];
  quizzes: ModuleQuiz[];
}
