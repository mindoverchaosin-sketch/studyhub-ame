import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export class CourseRepository {
  async findAll() {
    return prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      where: { deletedAt: null },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        categoryId: true,
        category: { select: { title: true } },
        isPremium: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        _count: {
          select: { modules: true },
        },
      },
    })
  }

  async findCategories() {
    return prisma.category.findMany({
      where: { deletedAt: null },
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    })
  }

  async findCategoryById(id: string) {
    return prisma.category.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    })
  }

  async findAllPublished() {
    return prisma.course.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findBySlug(slug: string) {
    return prisma.course.findUnique({ where: { slug } })
  }

  async findById(id: string) {
    return prisma.course.findUnique({ where: { id } })
  }

  async findAdminById(id: string) {
    return prisma.course.findUnique({
      where: { id },
      include: {
        category: { select: { title: true } },
        modules: {
          where: { deletedAt: null },
          select: { id: true, title: true, slug: true, moduleNumber: true, status: true, displayOrder: true },
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    })
  }

  async create(input: Prisma.CourseUncheckedCreateInput) {
    return prisma.course.create({ data: input })
  }

  async update(id: string, data: Prisma.CourseUpdateInput) {
    return prisma.course.update({ where: { id }, data })
  }

  async delete(id: string) {
    return prisma.course.delete({ where: { id } })
  }

  async setPublishState(id: string, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED') {
    return prisma.course.update({ where: { id }, data: { status } })
  }

  async findByCategory(categoryId: string) {
    return prisma.course.findMany({
      where: { categoryId, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
    })
  }
}

export const courseRepository = new CourseRepository()
