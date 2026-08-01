import { ValidationError, NotFoundError, DatabaseError, ForbiddenError } from '@/auth';
import { lessonRepository } from '@/server/repositories/lesson.repository';
import { mockTestRepository } from '@/server/repositories/mock-test.repository';
import { auditRepository } from '@/server/repositories/audit.repository';
import { moduleRepository } from '@/server/repositories/module.repository';
import { publishingService } from '@/server/services/publishing.service';
import { createLessonVersionSnapshot, publishLesson, unpublishLesson } from '@/server/services/editorial-workflow.service';
import type { AdminLesson, AdminMockTest, AdminModuleOption } from '@/types/admin';
import type { AdminCmsResponse } from '@/server/application/dto/admin-cms.dto';
import type { Status } from '@prisma/client';

function toAdminLesson(entity: any): AdminLesson {
  const metadata = entity.metadata ?? {};

  return {
    id: entity.id,
    title: entity.title,
    content: entity.description ?? '',
    objectives: Array.isArray(metadata.objectives) ? metadata.objectives : [],
    keyPoints: Array.isArray(metadata.keyPoints) ? metadata.keyPoints : [],
    resources: Array.isArray(metadata.resources) ? metadata.resources : [],
    attachments: Array.isArray(metadata.attachments) ? metadata.attachments : [],
    referenceLinks: Array.isArray(metadata.referenceLinks) ? metadata.referenceLinks : [],
    status: entity.status === 'PUBLISHED' ? 'Published' : entity.status === 'ARCHIVED' ? 'Archived' : 'Draft',
    order: entity.displayOrder ?? 0,
    module: entity.module?.title ?? undefined,
    moduleId: entity.module?.id ?? undefined,
    moduleTitle: entity.module?.title ?? undefined,
    updatedAt: entity.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

export async function listModules() {
  try {
    const modules = await moduleRepository.findAll();
    return buildSuccess(modules.map((module) => ({ id: module.id, title: module.title })) as AdminModuleOption[]);
  } catch (error) {
    return buildError('DATABASE_ERROR', 'Unable to load modules.', { cause: error instanceof Error ? error.message : String(error) });
  }
}

function toAdminMockTest(entity: any): AdminMockTest {
  return {
    id: entity.id,
    title: entity.title,
    durationMinutes: entity.durationMinutes ?? 60,
    passingPercentage: entity.passingPercentage ?? 60,
    questionCount: entity.questionCount ?? 20,
    randomized: entity.shuffleQuestions ?? false,
    status: entity.status === 'PUBLISHED' ? 'Published' : entity.status === 'ARCHIVED' ? 'Archived' : 'Draft',
    updatedAt: entity.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  };
}

function toPrismaStatus(status: AdminLesson['status'] | AdminMockTest['status']): Status {
  return status === 'Published' ? 'PUBLISHED' : status === 'Archived' ? 'ARCHIVED' : 'DRAFT';
}

function buildSuccess<T>(data: T): AdminCmsResponse<T> {
  return { success: true, data };
}

function buildError(code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'DATABASE_ERROR' | 'PERMISSION_ERROR', message: string, details?: Record<string, unknown>): AdminCmsResponse<never> {
  return { success: false, error: { code, message, details } };
}

export async function listLessons(params: { search?: string; moduleId?: string; page?: number; pageSize?: number; sortBy?: 'updated' | 'title' | 'created' } = {}) {
  try {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const rows = await lessonRepository.list({ search: params.search, moduleId: params.moduleId, sortBy: params.sortBy, skip: (page - 1) * pageSize, take: pageSize });
    const total = await lessonRepository.count({ search: params.search, moduleId: params.moduleId });
    return buildSuccess({ items: rows.map(toAdminLesson), total, page, pageSize });
  } catch (error) {
    return buildError('DATABASE_ERROR', 'Unable to load lessons.', { cause: error instanceof Error ? error.message : String(error) });
  }
}

export async function createLesson(input: Partial<AdminLesson>, actorUserId: string) {
  try {
    if (!input.title?.trim()) throw new ValidationError('Lesson title is required.');
    if (!input.content?.trim()) throw new ValidationError('Lesson content is required.');

    const moduleConnect = input.moduleId ? { connect: { id: input.moduleId } } : input.module ? { connect: { id: input.module } } : undefined;
    const created = await lessonRepository.create({
      title: input.title.trim(),
      description: input.content.trim(),
      module: moduleConnect,
      status: toPrismaStatus(input.status ?? 'Draft'),
      displayOrder: input.order ?? 0,
      metadata: {
        objectives: input.objectives ?? [],
        keyPoints: input.keyPoints ?? [],
        resources: input.resources ?? [],
        attachments: input.attachments ?? [],
        referenceLinks: input.referenceLinks ?? [],
      },
      slug: input.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    } as any);

    const createdLesson = created as any;

    await createLessonVersionSnapshot(
      createdLesson.id,
      'Initial lesson draft',
      'Editor',
      createdLesson.status === 'PUBLISHED' ? 'PUBLISHED' : createdLesson.status === 'ARCHIVED' ? 'ARCHIVED' : 'DRAFT',
      createdLesson.publishedAt ? createdLesson.publishedAt.toISOString() : null,
      {
        title: createdLesson.title,
        content: createdLesson.description,
        moduleId: createdLesson.moduleId,
        metadata: createdLesson.metadata,
      },
      actorUserId,
    );

    await auditRepository.recordEvent({ actorUserId, action: 'CREATE', targetType: 'LESSON', targetId: created.id, metadata: { title: created.title } });
    return buildSuccess(toAdminLesson(created));
  } catch (error) {
    if (error instanceof ValidationError) return buildError('VALIDATION_ERROR', error.message);
    if (error instanceof NotFoundError) return buildError('NOT_FOUND', error.message);
    if (error instanceof ForbiddenError) return buildError('PERMISSION_ERROR', error.message);
    return buildError('DATABASE_ERROR', 'Unable to create lesson.', { cause: error instanceof Error ? error.message : String(error) });
  }
}

export async function updateLesson(id: string, input: Partial<AdminLesson>, actorUserId: string) {
  try {
    const existing = await lessonRepository.findById(id);
    if (!existing) throw new NotFoundError('Lesson not found.');

    const moduleConnect = input.moduleId ? { connect: { id: input.moduleId } } : input.module ? { connect: { id: input.module } } : undefined;
    const existingLesson = existing as any;
    const updated = await lessonRepository.update(id, {
      title: input.title?.trim() ? input.title.trim() : undefined,
      description: typeof input.content === 'string' ? input.content.trim() : undefined,
      status: input.status ? toPrismaStatus(input.status) : undefined,
      displayOrder: typeof input.order === 'number' ? input.order : undefined,
      module: moduleConnect,
      metadata: {
        ...(existingLesson.metadata ?? {}),
        ...(input.objectives ? { objectives: input.objectives } : {}),
        ...(input.keyPoints ? { keyPoints: input.keyPoints } : {}),
        ...(input.resources ? { resources: input.resources } : {}),
        ...(input.attachments ? { attachments: input.attachments } : {}),
        ...(input.referenceLinks ? { referenceLinks: input.referenceLinks } : {}),
      },
    } as any);

    const versionStatus = input.status
      ? (toPrismaStatus(input.status) as 'PUBLISHED' | 'DRAFT' | 'ARCHIVED')
      : updated.status === 'PUBLISHED'
        ? 'PUBLISHED'
        : updated.status === 'ARCHIVED'
          ? 'ARCHIVED'
          : 'DRAFT';

    const updatedLesson = updated as any;

    await createLessonVersionSnapshot(id, `Saved lesson update: ${input.title ?? updatedLesson.title}`, 'Editor', versionStatus, updatedLesson.publishedAt ? updatedLesson.publishedAt.toISOString() : null, {
      title: updatedLesson.title,
      content: updatedLesson.description,
      moduleId: updatedLesson.moduleId,
      metadata: updatedLesson.metadata,
    }, actorUserId);

    await auditRepository.recordEvent({ actorUserId, action: 'UPDATE', targetType: 'LESSON', targetId: updated.id, metadata: { title: updated.title } });
    return buildSuccess(toAdminLesson(updated));
  } catch (error) {
    if (error instanceof ValidationError) return buildError('VALIDATION_ERROR', error.message);
    if (error instanceof NotFoundError) return buildError('NOT_FOUND', error.message);
    if (error instanceof ForbiddenError) return buildError('PERMISSION_ERROR', error.message);
    return buildError('DATABASE_ERROR', 'Unable to update lesson.', { cause: error instanceof Error ? error.message : String(error) });
  }
}

export async function deleteLesson(id: string, actorUserId: string) {
  try {
    const existing = await lessonRepository.findById(id);
    if (!existing) throw new NotFoundError('Lesson not found.');
    await lessonRepository.delete(id);
    await auditRepository.recordEvent({ actorUserId, action: 'DELETE', targetType: 'LESSON', targetId: id, metadata: { title: existing.title } });
    return buildSuccess({ deleted: true });
  } catch (error) {
    if (error instanceof ValidationError) return buildError('VALIDATION_ERROR', error.message);
    if (error instanceof NotFoundError) return buildError('NOT_FOUND', error.message);
    if (error instanceof ForbiddenError) return buildError('PERMISSION_ERROR', error.message);
    return buildError('DATABASE_ERROR', 'Unable to delete lesson.', { cause: error instanceof Error ? error.message : String(error) });
  }
}

export async function setLessonPublishState(id: string, published: boolean, actorUserId: string) {
  try {
    const existing = await lessonRepository.findById(id);
    if (!existing) throw new NotFoundError('Lesson not found.');
    const result = published
      ? await publishLesson(id, 'Editor', actorUserId)
      : await unpublishLesson(id, 'Editor', actorUserId);
    const updated = await lessonRepository.findById(id);
    await auditRepository.recordEvent({ actorUserId, action: published ? 'PUBLISH' : 'UNPUBLISH', targetType: 'LESSON', targetId: id, metadata: { title: updated?.title ?? existing.title } });
    return buildSuccess(toAdminLesson(updated ?? existing));
  } catch (error) {
    if (error instanceof ValidationError) return buildError('VALIDATION_ERROR', error.message);
    if (error instanceof NotFoundError) return buildError('NOT_FOUND', error.message);
    if (error instanceof ForbiddenError) return buildError('PERMISSION_ERROR', error.message);
    return buildError('DATABASE_ERROR', 'Unable to toggle lesson publish state.', { cause: error instanceof Error ? error.message : String(error) });
  }
}

export async function listMockTests(params: { search?: string; courseId?: string; page?: number; pageSize?: number; sortBy?: 'updated' | 'title' | 'created' } = {}) {
  try {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const rows = await mockTestRepository.list({ search: params.search, courseId: params.courseId, sortBy: params.sortBy, skip: (page - 1) * pageSize, take: pageSize });
    const total = await mockTestRepository.count({ search: params.search, courseId: params.courseId });
    return buildSuccess({ items: rows.map(toAdminMockTest), total, page, pageSize });
  } catch (error) {
    return buildError('DATABASE_ERROR', 'Unable to load mock tests.', { cause: error instanceof Error ? error.message : String(error) });
  }
}

export async function createMockTest(input: Partial<AdminMockTest>, actorUserId: string) {
  try {
    if (!input.title?.trim()) throw new ValidationError('Mock test title is required.');
    if ((input.durationMinutes ?? 0) <= 0) throw new ValidationError('Duration must be greater than zero.');
    if ((input.passingPercentage ?? 0) < 1 || (input.passingPercentage ?? 0) > 100) throw new ValidationError('Passing percentage must be between 1 and 100.');

    const created = await mockTestRepository.create({
      title: input.title.trim(),
      description: `${input.title.trim()} admin-created mock test`,
      status: toPrismaStatus(input.status ?? 'Draft'),
      course: { connect: { id: 'course-1' } },
      durationMinutes: input.durationMinutes ?? 60,
      questionCount: input.questionCount ?? 20,
      passingPercentage: input.passingPercentage ?? 60,
      shuffleQuestions: input.randomized ?? false,
    } as any);

    await auditRepository.recordEvent({ actorUserId, action: 'CREATE', targetType: 'MOCK_TEST', targetId: created.id, metadata: { title: created.title } });
    return buildSuccess(toAdminMockTest(created));
  } catch (error) {
    if (error instanceof ValidationError) return buildError('VALIDATION_ERROR', error.message);
    if (error instanceof NotFoundError) return buildError('NOT_FOUND', error.message);
    if (error instanceof ForbiddenError) return buildError('PERMISSION_ERROR', error.message);
    return buildError('DATABASE_ERROR', 'Unable to create mock test.', { cause: error instanceof Error ? error.message : String(error) });
  }
}

export async function updateMockTest(id: string, input: Partial<AdminMockTest>, actorUserId: string) {
  try {
    const existing = await mockTestRepository.findById(id);
    if (!existing) throw new NotFoundError('Mock test not found.');

    const updated = await mockTestRepository.update(id, {
      title: input.title?.trim() ? input.title.trim() : undefined,
      status: input.status ? toPrismaStatus(input.status) : undefined,
      durationMinutes: typeof input.durationMinutes === 'number' ? input.durationMinutes : undefined,
      questionCount: typeof input.questionCount === 'number' ? input.questionCount : undefined,
      passingPercentage: typeof input.passingPercentage === 'number' ? input.passingPercentage : undefined,
      shuffleQuestions: typeof input.randomized === 'boolean' ? input.randomized : undefined,
    } as any);

    await auditRepository.recordEvent({ actorUserId, action: 'UPDATE', targetType: 'MOCK_TEST', targetId: updated.id, metadata: { title: updated.title } });
    return buildSuccess(toAdminMockTest(updated));
  } catch (error) {
    if (error instanceof ValidationError) return buildError('VALIDATION_ERROR', error.message);
    if (error instanceof NotFoundError) return buildError('NOT_FOUND', error.message);
    if (error instanceof ForbiddenError) return buildError('PERMISSION_ERROR', error.message);
    return buildError('DATABASE_ERROR', 'Unable to update mock test.', { cause: error instanceof Error ? error.message : String(error) });
  }
}

export async function deleteMockTest(id: string, actorUserId: string) {
  try {
    const existing = await mockTestRepository.findById(id);
    if (!existing) throw new NotFoundError('Mock test not found.');
    await mockTestRepository.delete(id);
    await auditRepository.recordEvent({ actorUserId, action: 'DELETE', targetType: 'MOCK_TEST', targetId: id, metadata: { title: existing.title } });
    return buildSuccess({ deleted: true });
  } catch (error) {
    if (error instanceof ValidationError) return buildError('VALIDATION_ERROR', error.message);
    if (error instanceof NotFoundError) return buildError('NOT_FOUND', error.message);
    if (error instanceof ForbiddenError) return buildError('PERMISSION_ERROR', error.message);
    return buildError('DATABASE_ERROR', 'Unable to delete mock test.', { cause: error instanceof Error ? error.message : String(error) });
  }
}

export async function duplicateMockTest(id: string, actorUserId: string) {
  try {
    const duplicated = await mockTestRepository.duplicate(id);
    if (!duplicated) throw new NotFoundError('Mock test not found.');
    await auditRepository.recordEvent({ actorUserId, action: 'DUPLICATE', targetType: 'MOCK_TEST', targetId: duplicated.id, metadata: { title: duplicated.title } });
    return buildSuccess(toAdminMockTest(duplicated));
  } catch (error) {
    if (error instanceof NotFoundError) return buildError('NOT_FOUND', error.message);
    return buildError('DATABASE_ERROR', 'Unable to duplicate mock test.', { cause: error instanceof Error ? error.message : String(error) });
  }
}

export async function setMockTestPublishState(id: string, published: boolean, actorUserId: string) {
  try {
    const existing = await mockTestRepository.findById(id);
    if (!existing) throw new NotFoundError('Mock test not found.');
    const updated = await mockTestRepository.setPublishState(id, published ? 'PUBLISHED' : 'DRAFT');
    await auditRepository.recordEvent({ actorUserId, action: published ? 'PUBLISH' : 'UNPUBLISH', targetType: 'MOCK_TEST', targetId: updated.id, metadata: { title: updated.title } });
    return buildSuccess(toAdminMockTest(updated));
  } catch (error) {
    if (error instanceof ValidationError) return buildError('VALIDATION_ERROR', error.message);
    if (error instanceof NotFoundError) return buildError('NOT_FOUND', error.message);
    if (error instanceof ForbiddenError) return buildError('PERMISSION_ERROR', error.message);
    return buildError('DATABASE_ERROR', 'Unable to toggle mock test publish state.', { cause: error instanceof Error ? error.message : String(error) });
  }
}
