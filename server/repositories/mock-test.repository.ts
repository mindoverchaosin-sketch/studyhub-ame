import prisma from '@/lib/prisma';
import type { Prisma, Status } from '@prisma/client';

export type MockTestAdminQueryParams = {
  search?: string;
  courseId?: string;
  status?: Status;
  sortBy?: 'updated' | 'title' | 'created';
  skip?: number;
  take?: number;
};

export class MockTestRepository {
  async findById(id: string) {
    return prisma.mockTest.findUnique({ where: { id }, include: { course: true } });
  }

  async list(params: MockTestAdminQueryParams = {}) {
    const where: Prisma.MockTestWhereInput = {
      deletedAt: null,
      ...(params.search ? {
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } },
        ],
      } : {}),
      ...(params.courseId ? { courseId: params.courseId } : {}),
      ...(params.status ? { status: params.status } : {}),
    };

    const orderBy = params.sortBy === 'title'
      ? [{ title: 'asc' as const }]
      : params.sortBy === 'created'
        ? [{ createdAt: 'desc' as const }]
        : [{ updatedAt: 'desc' as const }];

    return prisma.mockTest.findMany({
      where,
      include: { course: true, questionBanks: true },
      skip: params.skip ?? 0,
      take: params.take ?? 20,
      orderBy,
    });
  }

  async count(params: Omit<MockTestAdminQueryParams, 'skip' | 'take' | 'sortBy'> = {}) {
    const where: Prisma.MockTestWhereInput = {
      deletedAt: null,
      ...(params.search ? {
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } },
        ],
      } : {}),
      ...(params.courseId ? { courseId: params.courseId } : {}),
      ...(params.status ? { status: params.status } : {}),
    };

    return prisma.mockTest.count({ where });
  }

  async create(input: Prisma.MockTestCreateInput) {
    return prisma.mockTest.create({ data: input, include: { course: true, questionBanks: true } });
  }

  async update(id: string, data: Prisma.MockTestUpdateInput) {
    return prisma.mockTest.update({ where: { id }, data, include: { course: true, questionBanks: true } });
  }

  async delete(id: string) {
    return prisma.mockTest.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async setPublishState(id: string, status: Status) {
    return prisma.mockTest.update({ where: { id }, data: { status, publishedAt: status === 'PUBLISHED' ? new Date() : null }, include: { course: true, questionBanks: true } });
  }

  async duplicate(id: string) {
    return prisma.$transaction(async (tx) => {
      const source = await tx.mockTest.findUnique({ where: { id }, include: { questionBanks: true } });
      if (!source) throw new Error('Mock test not found');

      const created = await tx.mockTest.create({
        data: {
          courseId: source.courseId,
          title: `${source.title} Copy`,
          description: source.description,
          status: source.status,
        },
        include: { course: true, questionBanks: true },
      });

      if (source.questionBanks.length) {
        await tx.mockTest.update({
          where: { id: created.id },
          data: {
            questionBanks: {
              connect: source.questionBanks.map((bank) => ({ id: bank.id })),
            },
          },
        });
      }

      return tx.mockTest.findUnique({ where: { id: created.id }, include: { course: true, questionBanks: true } });
    });
  }
}

export const mockTestRepository = new MockTestRepository();
