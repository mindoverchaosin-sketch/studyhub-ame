export type ContentKind = "course" | "module" | "lesson" | "study-material" | "video" | "pdf" | "notes" | "quiz" | "mock-test";

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  categoryId: string;
  tags: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  courseId: string;
  slug: string;
  title: string;
  moduleNumber: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedHours: number;
  displayOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  slug: string;
  title: string;
  description: string;
  durationMinutes: number;
  displayOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudyMaterial {
  id: string;
  lessonId?: string;
  moduleId?: string;
  title: string;
  kind: "Video" | "PDF" | "Notes";
  url: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Quiz {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  timeLimitMinutes: number;
  passingScore: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MockTest {
  id: string;
  courseId: string;
  title: string;
  description: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  quizId?: string;
  mockTestId?: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}

export interface QuestionBank {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  questionIds: string[];
}

export interface LearningObjective {
  id: string;
  moduleId: string;
  description: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Category {
  id: string;
  title: string;
  slug: string;
}
