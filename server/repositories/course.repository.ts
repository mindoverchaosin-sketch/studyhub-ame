import prisma from '@/lib/prisma'
import type { Course, ExamType, Prisma } from '@prisma/client'

export class CourseRepository {
  async findAll() {
    return prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: { modules: true },
    })
  }

  async findAllPublished() {
    return prisma.course.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findBySlug(slug: string) {
    return prisma.course.findUnique({ where: { slug } })
  }

  async findById(id: string) {
    return prisma.course.findUnique({ where: { id } })
  }

  async create(input: Prisma.CourseCreateInput) {
    return prisma.course.create({ data: input })
  }

  async update(id: string, data: Prisma.CourseUpdateInput) {
    return prisma.course.update({ where: { id }, data })
  }

  async delete(id: string) {
    return prisma.course.delete({ where: { id } })
  }

  async setPublishState(id: string, isPublished: boolean) {
    return prisma.course.update({ where: { id }, data: { isPublished } })
  }

  async findByExamType(examType: string) {
    return prisma.course.findMany({
      where: { examType: examType as ExamType, isPublished: true },
      orderBy: { createdAt: 'desc' },
    })
  }
}

export const courseRepository = new CourseRepository()
