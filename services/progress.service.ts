import type { LessonProgress, ModuleProgress, Progress, QuizAttempt, MockTestAttempt } from "@/types/domain/learning";

export interface ProgressService {
  getProgress(userId: string, courseId: string): Promise<Progress | null>;
  updateLessonProgress(progress: LessonProgress): Promise<void>;
  updateModuleProgress(progress: ModuleProgress): Promise<void>;
  submitQuizAttempt(attempt: QuizAttempt): Promise<void>;
  submitMockTestAttempt(attempt: MockTestAttempt): Promise<void>;
}
