import prisma from '@/lib/prisma'

export class CategoryRepository {
  async findActive() {
    return prisma.category.findMany({
      where: { deletedAt: null },
      select: { id: true, slug: true, title: true, description: true },
      orderBy: { title: 'asc' },
    })
  }

  async create(input: { slug: string; title: string; description: string | null }) {
    return prisma.category.create({
      data: input,
      select: { id: true, slug: true, title: true, description: true },
    })
  }
}

export const categoryRepository = new CategoryRepository()
