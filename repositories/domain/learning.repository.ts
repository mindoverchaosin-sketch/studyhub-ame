import type { Enrollment, Progress, LessonProgress, ModuleProgress, QuizAttempt, MockTestAttempt, Bookmark, StudyStreak, Achievement, Certificate } from "@/types/domain/learning";

export interface LearningRepository {
  getEnrollments(userId: string): Promise<Enrollment[]>;
  getProgress(userId: string, courseId: string): Promise<Progress | null>;
  getLessonProgress(userId: string): Promise<LessonProgress[]>;
  getModuleProgress(userId: string): Promise<ModuleProgress[]>;
  getQuizAttempts(userId: string): Promise<QuizAttempt[]>;
  getMockTestAttempts(userId: string): Promise<MockTestAttempt[]>;
  getBookmarks(userId: string): Promise<Bookmark[]>;
  getStudyStreak(userId: string): Promise<StudyStreak | null>;
  getAchievements(userId: string): Promise<Achievement[]>;
  getCertificates(userId: string): Promise<Certificate[]>;
}
