import prisma from '@/lib/prisma'
import type { Prisma, InvoiceStatus } from '@prisma/client'

export class InvoiceRepository {
  async findAll() {
    return prisma.invoice.findMany({
      include: { subscription: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string) {
    return prisma.invoice.findUnique({
      where: { id },
      include: { subscription: true },
    })
  }

  async findBySubscriptionId(subscriptionId: string) {
    return prisma.invoice.findMany({
      where: { subscriptionId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findByInvoiceNumber(invoiceNumber: string) {
    return prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: { subscription: true },
    })
  }

  async findManyByStatus(status: InvoiceStatus) {
    return prisma.invoice.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findUnpaidInvoices() {
    return prisma.invoice.findMany({
      where: { 
        status: { notIn: ['PAID' as InvoiceStatus, 'CANCELLED' as InvoiceStatus] },
      },
      include: { subscription: true },
      orderBy: { dueDate: 'asc' },
    })
  }

  async findOverdueInvoices() {
    return prisma.invoice.findMany({
      where: {
        status: { notIn: ['PAID' as InvoiceStatus, 'CANCELLED' as InvoiceStatus] },
        dueDate: { lt: new Date() },
      },
      include: { subscription: true },
      orderBy: { dueDate: 'asc' },
    })
  }

  async create(input: Prisma.InvoiceCreateInput) {
    return prisma.invoice.create({
      data: input,
      include: { subscription: true },
    })
  }

  async update(id: string, data: Prisma.InvoiceUpdateInput) {
    return prisma.invoice.update({
      where: { id },
      data,
      include: { subscription: true },
    })
  }

  async markAsPaid(id: string) {
    return prisma.invoice.update({
      where: { id },
      data: {
        status: 'PAID' as InvoiceStatus,
        paidAt: new Date(),
      },
      include: { subscription: true },
    })
  }

  async markAsSent(id: string) {
    return prisma.invoice.update({
      where: { id },
      data: { status: 'SENT' as InvoiceStatus },
      include: { subscription: true },
    })
  }

  async countByStatus(status: InvoiceStatus) {
    return prisma.invoice.count({ where: { status } })
  }

  async countUnpaid() {
    return prisma.invoice.count({
      where: {
        status: { notIn: ['PAID' as InvoiceStatus, 'CANCELLED' as InvoiceStatus] },
      },
    })
  }
}

export const invoiceRepository = new InvoiceRepository()
