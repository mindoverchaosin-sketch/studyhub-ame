import prisma from '@/lib/prisma'
import type { Prisma, SubscriptionStatus } from '@prisma/client'

export class SubscriptionRepository {
  async findByUserId(userId: string) {
    return prisma.subscription.findFirst({
      where: { userId },
      include: { subscriptionPlan: { include: { productPrice: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string) {
    return prisma.subscription.findUnique({
      where: { id },
      include: { subscriptionPlan: { include: { productPrice: true } } },
    })
  }

  async findMany(where?: Prisma.SubscriptionWhereInput) {
    return prisma.subscription.findMany({
      where,
      include: { subscriptionPlan: { include: { productPrice: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findManyByStatus(status: SubscriptionStatus) {
    return prisma.subscription.findMany({
      where: { status },
      include: { subscriptionPlan: { include: { productPrice: true } } },
    })
  }

  async findActiveSubscriptions() {
    return prisma.subscription.findMany({
      where: { status: 'ACTIVE' as SubscriptionStatus },
      include: { subscriptionPlan: { include: { productPrice: true } } },
    })
  }

  async findExpiredSubscriptions() {
    return prisma.subscription.findMany({
      where: { 
        status: 'ACTIVE' as SubscriptionStatus,
        currentPeriodEnd: { lt: new Date() },
      },
      include: { subscriptionPlan: { include: { productPrice: true } } },
    })
  }

  async create(input: Prisma.SubscriptionCreateInput) {
    return prisma.subscription.create({
      data: input,
      include: { subscriptionPlan: { include: { productPrice: true } } },
    })
  }

  async update(id: string, data: Prisma.SubscriptionUpdateInput) {
    return prisma.subscription.update({
      where: { id },
      data,
      include: { subscriptionPlan: { include: { productPrice: true } } },
    })
  }

  async cancel(id: string, reason?: string) {
    return prisma.subscription.update({
      where: { id },
      data: {
        status: 'CANCELLED' as SubscriptionStatus,
        cancelledAt: new Date(),
      },
      include: { subscriptionPlan: { include: { productPrice: true } } },
    })
  }

  async expire(id: string) {
    return prisma.subscription.update({
      where: { id },
      data: { status: 'EXPIRED' as SubscriptionStatus },
      include: { subscriptionPlan: { include: { productPrice: true } } },
    })
  }

  async countByStatus(status: SubscriptionStatus) {
    return prisma.subscription.count({ where: { status } })
  }

  async countActiveSubscriptions() {
    return prisma.subscription.count({ where: { status: 'ACTIVE' as SubscriptionStatus } })
  }
}

export const subscriptionRepository = new SubscriptionRepository()
