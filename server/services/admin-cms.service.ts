import { ValidationError, NotFoundError, ForbiddenError } from '@/auth';
import { lessonRepository } from '@/server/repositories/lesson.repository';
import { examTemplateRepository } from '@/server/repositories/exam-template.repository';
import * as examTemplateService from '@/server/services/exam-template.service';
import { auditRepository } from '@/server/repositories/audit.repository';
import { moduleRepository } from '@/server/repositories/module.repository';
import { createLessonVersionSnapshot, publishLesson, unpublishLesson } from '@/server/services/editorial-workflow.service';
import type { AdminLesson, AdminMockTest, AdminModuleOption } from '@/types/admin';
import type { AdminCmsResponse } from '@/server/application/dto/admin-cms.dto';
import type { ExamTemplateDTO } from '@/server/application/dto/exam-template.dto';
import type { Status } from '@prisma/client';

type LessonEntity = NonNullable<Awaited<ReturnType<typeof lessonRepository.findById>>> & {
  module?: { id: string; title: string } | null
}
type ExamTemplateEntity = NonNullable<Awaited<ReturnType<typeof examTemplateRepository.getTemplate>>>
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function toAdminLesson(entity: LessonEntity): AdminLesson {
  const metadata = isRecord(entity.metadata) ? entity.metadata : {}

  return {
    id: entity.id,
    title: entity.title,
    content: entity.description ?? '',
    objectives: stringList(metadata.objectives),
    keyPoints: stringList(metadata.keyPoints),
    resources: stringList(metadata.resources),
    attachments: stringList(metadata.attachments),
    referenceLinks: stringList(metadata.referenceLinks),
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

function toAdminMockTest(entity: ExamTemplateEntity | ExamTemplateDTO): AdminMockTest {
  return {
    id: entity.id,
    title: entity.name,
    durationMinutes: entity.durationMinutes,
    passingPercentage: entity.passingPercentage,
    questionCount: entity.questionCount,
    randomized: entity.shuffleQuestions,
    status: entity.active ? 'Published' : 'Draft',
    isPremium: entity.isPremium,
    updatedAt: entity.updatedAt instanceof Date ? entity.updatedAt.toISOString() : entity.updatedAt,
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
    if (!moduleConnect) throw new ValidationError('Lesson module is required.');
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
    });

    await createLessonVersionSnapshot(
      created.id,
      'Initial lesson draft',
      'Editor',
      created.status === 'PUBLISHED' ? 'PUBLISHED' : created.status === 'ARCHIVED' ? 'ARCHIVED' : 'DRAFT',
      created.publishedAt ? created.publishedAt.toISOString() : null,
      {
        title: created.title,
        content: created.description,
        moduleId: created.moduleId,
        metadata: created.metadata,
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
    const existingMetadata = isRecord(existing.metadata) ? existing.metadata : {};
    const updated = await lessonRepository.update(id, {
      title: input.title?.trim() ? input.title.trim() : undefined,
      description: typeof input.content === 'string' ? input.content.trim() : undefined,
      status: input.status ? toPrismaStatus(input.status) : undefined,
      displayOrder: typeof input.order === 'number' ? input.order : undefined,
      module: moduleConnect,
      metadata: {
        ...existingMetadata,
        ...(input.objectives ? { objectives: input.objectives } : {}),
        ...(input.keyPoints ? { keyPoints: input.keyPoints } : {}),
        ...(input.resources ? { resources: input.resources } : {}),
        ...(input.attachments ? { attachments: input.attachments } : {}),
        ...(input.referenceLinks ? { referenceLinks: input.referenceLinks } : {}),
      },
    });

    const versionStatus = input.status
      ? (toPrismaStatus(input.status) as 'PUBLISHED' | 'DRAFT' | 'ARCHIVED')
      : updated.status === 'PUBLISHED'
        ? 'PUBLISHED'
        : updated.status === 'ARCHIVED'
          ? 'ARCHIVED'
          : 'DRAFT';

    await createLessonVersionSnapshot(id, `Saved lesson update: ${input.title ?? updated.title}`, 'Editor', versionStatus, updated.publishedAt ? updated.publishedAt.toISOString() : null, {
      title: updated.title,
      content: updated.description,
      moduleId: updated.moduleId,
      metadata: updated.metadata,
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
    if (published) await publishLesson(id, 'Editor', actorUserId)
    else await unpublishLesson(id, 'Editor', actorUserId)
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
    const [rows, total] = await Promise.all([
      examTemplateRepository.listTemplates({ search: params.search, courseId: params.courseId, sortBy: params.sortBy, skip: (page - 1) * pageSize, take: pageSize }),
      examTemplateRepository.countTemplates({ search: params.search, courseId: params.courseId }),
    ]);
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

    const created = await examTemplateService.createTemplate({
      name: input.title.trim(),
      description: `${input.title.trim()} admin-created mock test`,
      durationMinutes: input.durationMinutes ?? 60,
      questionCount: input.questionCount ?? 20,
      passingPercentage: input.passingPercentage ?? 60,
      shuffleQuestions: input.randomized ?? false,
      active: input.status === 'Published',
      isPremium: input.isPremium ?? false,
    });

    await auditRepository.recordEvent({ actorUserId, action: 'CREATE', targetType: 'EXAM_TEMPLATE', targetId: created.id, metadata: { title: created.name } });
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
    const existing = await examTemplateRepository.getTemplate(id);
    if (!existing) throw new NotFoundError('Mock test not found.');

    const updated = await examTemplateService.updateTemplate(id, {
      ...(input.title?.trim() ? { name: input.title.trim() } : {}),
      ...(typeof input.durationMinutes === 'number' ? { durationMinutes: input.durationMinutes } : {}),
      ...(typeof input.questionCount === 'number' ? { questionCount: input.questionCount } : {}),
      ...(typeof input.passingPercentage === 'number' ? { passingPercentage: input.passingPercentage } : {}),
      ...(typeof input.randomized === 'boolean' ? { shuffleQuestions: input.randomized } : {}),
      ...(input.status ? { active: input.status === 'Published' } : {}),
      ...(typeof input.isPremium === 'boolean' ? { isPremium: input.isPremium } : {}),
    });

    await auditRepository.recordEvent({ actorUserId, action: 'UPDATE', targetType: 'EXAM_TEMPLATE', targetId: updated.id, metadata: { title: updated.name } });
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
    const existing = await examTemplateRepository.getTemplate(id);
    if (!existing) throw new NotFoundError('Mock test not found.');
    await examTemplateService.deleteTemplate(id);
    await auditRepository.recordEvent({ actorUserId, action: 'DELETE', targetType: 'EXAM_TEMPLATE', targetId: id, metadata: { title: existing.name } });
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
    const existing = await examTemplateRepository.getTemplate(id);
    if (!existing) throw new NotFoundError('Mock test not found.');
    const duplicated = await examTemplateService.createTemplate({
      name: `${existing.name} Copy`,
      description: existing.description ?? undefined,
      questionBankId: existing.questionBankId ?? undefined,
      moduleId: existing.moduleId ?? undefined,
      courseId: existing.courseId ?? undefined,
      durationMinutes: existing.durationMinutes,
      questionCount: existing.questionCount,
      passingPercentage: existing.passingPercentage,
      shuffleQuestions: existing.shuffleQuestions,
      shuffleAnswers: existing.shuffleAnswers,
      negativeMarkingEnabled: existing.negativeMarkingEnabled,
      active: existing.active,
      isPremium: existing.isPremium,
    });
    if (!duplicated) throw new NotFoundError('Mock test not found.');
    await auditRepository.recordEvent({ actorUserId, action: 'DUPLICATE', targetType: 'EXAM_TEMPLATE', targetId: duplicated.id, metadata: { title: duplicated.name } });
    return buildSuccess(toAdminMockTest(duplicated));
  } catch (error) {
    if (error instanceof NotFoundError) return buildError('NOT_FOUND', error.message);
    return buildError('DATABASE_ERROR', 'Unable to duplicate mock test.', { cause: error instanceof Error ? error.message : String(error) });
  }
}

export async function setMockTestPublishState(id: string, published: boolean, actorUserId: string) {
  try {
    const existing = await examTemplateRepository.getTemplate(id);
    if (!existing) throw new NotFoundError('Mock test not found.');
    const updated = await examTemplateService.activateTemplate(id, published);
    await auditRepository.recordEvent({ actorUserId, action: published ? 'PUBLISH' : 'UNPUBLISH', targetType: 'EXAM_TEMPLATE', targetId: updated.id, metadata: { title: updated.name } });
    return buildSuccess(toAdminMockTest(updated));
  } catch (error) {
    if (error instanceof ValidationError) return buildError('VALIDATION_ERROR', error.message);
    if (error instanceof NotFoundError) return buildError('NOT_FOUND', error.message);
    if (error instanceof ForbiddenError) return buildError('PERMISSION_ERROR', error.message);
    return buildError('DATABASE_ERROR', 'Unable to toggle mock test publish state.', { cause: error instanceof Error ? error.message : String(error) });
  }
}
