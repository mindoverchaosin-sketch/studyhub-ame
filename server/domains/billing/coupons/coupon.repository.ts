import prisma from '@/lib/prisma'

export class CouponRepository {
  async findByCode(code: string) {
    return prisma.coupon.findUnique({
      where: { code },
    })
  }

  async findById(id: string) {
    return prisma.coupon.findUnique({
      where: { id },
    })
  }

  async findActive() {
    return prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findAll() {
    return prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  async isValid(code: string): Promise<boolean> {
    const coupon = await this.findByCode(code)
    if (!coupon) return false
    if (!coupon.isActive) return false
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return false
    return true
  }

  async create(data: {
    code: string
    discountType: string
    discountValue: number
    expiresAt?: Date | null
    isActive?: boolean
  }) {
    return prisma.coupon.create({ data })
  }

  async update(id: string, data: { code?: string; discountType?: string; discountValue?: number; isActive?: boolean; expiresAt?: Date | null }) {
    return prisma.coupon.update({ where: { id }, data })
  }

  async deactivate(id: string) {
    return prisma.coupon.update({
      where: { id },
      data: { isActive: false },
    })
  }

  async countActive() {
    return prisma.coupon.count({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    })
  }
}

export const couponRepository = new CouponRepository()
