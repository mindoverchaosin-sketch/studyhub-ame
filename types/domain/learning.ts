export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: "active" | "completed" | "paused";
  enrolledAt: string;
}

export interface Progress {
  id: string;
  userId: string;
  courseId: string;
  completionPercent: number;
  updatedAt: string;
}

export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  status: "not-started" | "in-progress" | "completed";
  percentComplete: number;
  updatedAt: string;
}

export interface ModuleProgress {
  id: string;
  userId: string;
  moduleId: string;
  status: "not-started" | "in-progress" | "completed";
  percentComplete: number;
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  passed: boolean;
  attemptedAt: string;
}

export interface MockTestAttempt {
  id: string;
  userId: string;
  mockTestId: string;
  score: number;
  passed: boolean;
  attemptedAt: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  resourceId: string;
  createdAt: string;
}

export interface StudyStreak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  updatedAt: string;
}

export interface Achievement {
  id: string;
  userId: string;
  title: string;
  earnedAt: string;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  issuedAt: string;
}
