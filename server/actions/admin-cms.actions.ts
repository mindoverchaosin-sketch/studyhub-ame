'use server';

import { requirePermission } from '@/auth';
import * as adminCmsService from '@/server/services/admin-cms.service';

export async function listAdminLessons(input: { search?: string; moduleId?: string; page?: number; pageSize?: number; sortBy?: 'updated' | 'title' | 'created' } = {}) {
  await requirePermission('manageModules');
  return adminCmsService.listLessons(input);
}

export async function listAdminModules() {
  await requirePermission('manageModules');
  return adminCmsService.listModules();
}

export async function createAdminLesson(input: any) {
  await requirePermission('manageModules');
  const session = await requirePermission('manageModules');
  return adminCmsService.createLesson(input, session.user.id);
}

export async function updateAdminLesson(id: string, input: any) {
  await requirePermission('manageModules');
  const session = await requirePermission('manageModules');
  return adminCmsService.updateLesson(id, input, session.user.id);
}

export async function deleteAdminLesson(id: string) {
  await requirePermission('manageModules');
  const session = await requirePermission('manageModules');
  return adminCmsService.deleteLesson(id, session.user.id);
}

export async function setAdminLessonPublishState(id: string, published: boolean) {
  await requirePermission('manageModules');
  const session = await requirePermission('manageModules');
  return adminCmsService.setLessonPublishState(id, published, session.user.id);
}

export async function listAdminMockTests(input: { search?: string; courseId?: string; page?: number; pageSize?: number; sortBy?: 'updated' | 'title' | 'created' } = {}) {
  await requirePermission('manageModules');
  return adminCmsService.listMockTests(input);
}

export async function createAdminMockTest(input: any) {
  await requirePermission('manageModules');
  const session = await requirePermission('manageModules');
  return adminCmsService.createMockTest(input, session.user.id);
}

export async function updateAdminMockTest(id: string, input: any) {
  await requirePermission('manageModules');
  const session = await requirePermission('manageModules');
  return adminCmsService.updateMockTest(id, input, session.user.id);
}

export async function deleteAdminMockTest(id: string) {
  await requirePermission('manageModules');
  const session = await requirePermission('manageModules');
  return adminCmsService.deleteMockTest(id, session.user.id);
}

export async function duplicateAdminMockTest(id: string) {
  await requirePermission('manageModules');
  const session = await requirePermission('manageModules');
  return adminCmsService.duplicateMockTest(id, session.user.id);
}

export async function setAdminMockTestPublishState(id: string, published: boolean) {
  await requirePermission('manageModules');
  const session = await requirePermission('manageModules');
  return adminCmsService.setMockTestPublishState(id, published, session.user.id);
}
