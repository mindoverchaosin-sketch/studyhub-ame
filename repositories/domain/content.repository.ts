import type { Course, Module, Lesson, StudyMaterial, Quiz, MockTest, Question, QuestionBank, LearningObjective, Tag, Category } from "@/types/domain/content";

export interface ContentRepository {
  getCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | null>;
  getModules(courseId: string): Promise<Module[]>;
  getModule(id: string): Promise<Module | null>;
  getLessons(moduleId: string): Promise<Lesson[]>;
  getLesson(id: string): Promise<Lesson | null>;
  getStudyMaterials(moduleId?: string): Promise<StudyMaterial[]>;
  getQuizzes(moduleId: string): Promise<Quiz[]>;
  getMockTests(courseId: string): Promise<MockTest[]>;
  getQuestions(quizId?: string): Promise<Question[]>;
  getQuestionBanks(): Promise<QuestionBank[]>;
  getLearningObjectives(moduleId: string): Promise<LearningObjective[]>;
  getTags(): Promise<Tag[]>;
  getCategories(): Promise<Category[]>;
}
