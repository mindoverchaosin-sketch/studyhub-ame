import prisma from '@/lib/prisma'
import type { Prisma, StudyMaterialType } from '@prisma/client'

export class ResourceRepository {
  async findByLesson(lessonId: string) {
    return prisma.studyMaterial.findMany({
      where: { lessonId },
      orderBy: { createdAt: 'asc' },
    })
  }

  async findById(id: string) {
    return prisma.studyMaterial.findUnique({ where: { id } })
  }

  async findByLessonAndType(lessonId: string, materialType: StudyMaterialType) {
    return prisma.studyMaterial.findMany({
      where: { lessonId, materialType },
      orderBy: { createdAt: 'asc' },
    })
  }

  async countAll() {
    return prisma.studyMaterial.count()
  }

  async create(input: Prisma.StudyMaterialCreateInput) {
    return prisma.studyMaterial.create({ data: input })
  }

  async update(id: string, data: Prisma.StudyMaterialUpdateInput) {
    return prisma.studyMaterial.update({ where: { id }, data })
  }

  async delete(id: string) {
    return prisma.studyMaterial.delete({ where: { id } })
  }
}

export const resourceRepository = new ResourceRepository()
