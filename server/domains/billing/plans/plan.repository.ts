import prisma from '@/lib/prisma'

export class PlanRepository {
  async findBySlug(slug: string) {
    return prisma.subscriptionPlan.findUnique({
      where: { slug },
      include: { productPrice: { include: { product: true } } },
    })
  }

  async findById(id: string) {
    return prisma.subscriptionPlan.findUnique({
      where: { id },
      include: { productPrice: { include: { product: true } } },
    })
  }

  async findAll() {
    return prisma.subscriptionPlan.findMany({
      include: { productPrice: { include: { product: true } } },
      orderBy: { createdAt: 'asc' },
    })
  }

  async findActive() {
    return prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      include: { productPrice: { include: { product: true } } },
      orderBy: { createdAt: 'asc' },
    })
  }

  async create(data: {
    slug: string
    name: string
    interval: string
    productPriceId: string
    isActive?: boolean
  }) {
    return prisma.subscriptionPlan.create({
      data,
      include: { productPrice: { include: { product: true } } },
    })
  }

  async update(id: string, data: { slug?: string; isActive?: boolean; name?: string; interval?: string; productPriceId?: string }) {
    return prisma.subscriptionPlan.update({
      where: { id },
      data,
      include: { productPrice: { include: { product: true } } },
    })
  }

  async countAll() {
    return prisma.subscriptionPlan.count()
  }
}

export const planRepository = new PlanRepository()
