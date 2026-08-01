import prisma from '@/lib/prisma';
import type { Prisma, Status } from '@prisma/client';

export type LessonAdminQueryParams = {
  search?: string;
  moduleId?: string;
  status?: Status;
  sortBy?: 'updated' | 'title' | 'created';
  skip?: number;
  take?: number;
};

export class LessonRepository {
  async findById(id: string) {
    return prisma.lesson.findUnique({ where: { id } });
  }

  async list(params: LessonAdminQueryParams = {}) {
    const where: Prisma.LessonWhereInput = {
      deletedAt: null,
      ...(params.search ? {
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } },
        ],
      } : {}),
      ...(params.moduleId ? { moduleId: params.moduleId } : {}),
      ...(params.status ? { status: params.status } : {}),
    };

    const orderBy = params.sortBy === 'title'
      ? [{ title: 'asc' as const }]
      : params.sortBy === 'created'
        ? [{ createdAt: 'desc' as const }]
        : [{ updatedAt: 'desc' as const }];

    return prisma.lesson.findMany({
      where,
      include: { module: true },
      skip: params.skip ?? 0,
      take: params.take ?? 20,
      orderBy,
    });
  }

  async count(params: Omit<LessonAdminQueryParams, 'skip' | 'take' | 'sortBy'> = {}) {
    const where: Prisma.LessonWhereInput = {
      deletedAt: null,
      ...(params.search ? {
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } },
        ],
      } : {}),
      ...(params.moduleId ? { moduleId: params.moduleId } : {}),
      ...(params.status ? { status: params.status } : {}),
    };

    return prisma.lesson.count({ where });
  }

  async create(input: Prisma.LessonCreateInput) {
    return prisma.lesson.create({ data: input, include: { module: true } });
  }

  async update(id: string, data: Prisma.LessonUpdateInput) {
    return prisma.lesson.update({ where: { id }, data, include: { module: true } });
  }

  async delete(id: string) {
    return prisma.lesson.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async setPublishState(id: string, status: Status) {
    return prisma.lesson.update({ where: { id }, data: { status, publishedAt: status === 'PUBLISHED' ? new Date() : null }, include: { module: true } });
  }
}

export const lessonRepository = new LessonRepository();
