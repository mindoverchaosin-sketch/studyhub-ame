import type { AdminAnnouncement, AdminCourse, AdminLesson, AdminMockTest, AdminModule, AdminModuleOption, AdminPromptTemplate, AdminQuestion, AdminAnalyticsSnapshot } from '@/types/admin';
import {
  createAdminLesson,
  createAdminMockTest,
  deleteAdminLesson,
  deleteAdminMockTest,
  duplicateAdminMockTest,
  listAdminLessons,
  listAdminMockTests,
  listAdminModules,
  setAdminLessonPublishState,
  setAdminMockTestPublishState,
  updateAdminLesson,
  updateAdminMockTest,
} from '@/server/actions/admin-cms.actions';

export class AdminContentService {
  async listCourses() {
    return [] as AdminCourse[];
  }
  createCourse(input: Omit<AdminCourse, 'id' | 'createdAt' | 'updatedAt'>) {
    return input as AdminCourse;
  }
  updateCourse(id: string, changes: Partial<AdminCourse>) {
    return { id, ...changes } as AdminCourse;
  }

  async listModules() {
    const response = await listAdminModules();
    return response.success ? (response.data as AdminModuleOption[]) : [];
  }
  createModule(input: Omit<AdminModule, 'id'>) { return input as AdminModule; }
  updateModule(id: string, changes: Partial<AdminModule>) { return { id, ...changes } as AdminModule; }

  async listLessons() {
    const response = await listAdminLessons();
    return response.success ? (response.data.items as AdminLesson[]) : [];
  }
  async createLesson(input: Partial<AdminLesson>) {
    const response = await createAdminLesson(input);
    return response.success ? (response.data as AdminLesson) : null;
  }
  async updateLesson(id: string, changes: Partial<AdminLesson>) {
    const response = await updateAdminLesson(id, changes);
    return response.success ? (response.data as AdminLesson) : null;
  }
  async deleteLesson(id: string) {
    const response = await deleteAdminLesson(id);
    return response.success;
  }
  async setLessonPublishState(id: string, published: boolean) {
    const response = await setAdminLessonPublishState(id, published);
    return response.success ? (response.data as AdminLesson) : null;
  }

  async listQuestions() { return [] as AdminQuestion[]; }
  createQuestion(input: Omit<AdminQuestion, 'id'>) { return input as AdminQuestion; }
  updateQuestion(id: string, changes: Partial<AdminQuestion>) { return { id, ...changes } as AdminQuestion; }
  deleteQuestion(id: string) { return !!id; }

  async listMockTests() {
    const response = await listAdminMockTests();
    return response.success ? (response.data.items as AdminMockTest[]) : [];
  }
  async createMockTest(input: Partial<AdminMockTest>) {
    const response = await createAdminMockTest(input);
    return response.success ? (response.data as AdminMockTest) : null;
  }
  async updateMockTest(id: string, changes: Partial<AdminMockTest>) {
    const response = await updateAdminMockTest(id, changes);
    return response.success ? (response.data as AdminMockTest) : null;
  }
  async deleteMockTest(id: string) {
    const response = await deleteAdminMockTest(id);
    return response.success;
  }
  async duplicateMockTest(id: string) {
    const response = await duplicateAdminMockTest(id);
    return response.success ? (response.data as AdminMockTest) : null;
  }
  async setMockTestPublishState(id: string, published: boolean) {
    const response = await setAdminMockTestPublishState(id, published);
    return response.success ? (response.data as AdminMockTest) : null;
  }

  listPrompts() { return [] as AdminPromptTemplate[]; }
  updatePrompt(id: string, changes: Partial<AdminPromptTemplate>) { return { id, ...changes } as AdminPromptTemplate; }

  listAnnouncements() { return [] as AdminAnnouncement[]; }
  createAnnouncement(input: Omit<AdminAnnouncement, 'id'>) { return input as AdminAnnouncement; }
  updateAnnouncement(id: string, changes: Partial<AdminAnnouncement>) { return { id, ...changes } as AdminAnnouncement; }

  getAnalytics(): AdminAnalyticsSnapshot {
    return {
      studentGrowth: 18,
      mockCompletionRate: 74,
      aiUsage: 126,
      questionBankActivity: 52,
      popularModules: ['Aircraft Materials', 'Hydraulic Systems'],
      completionRates: { 'DGCA Modules': 81, 'EASA Modules': 76 },
    };
  }
}

export const adminContentService = new AdminContentService();
