import { invoiceRepository } from '@/server/domains/billing/invoices/invoice.repository'
import type { InvoiceDTO, InvoiceListDTO } from '@/server/domains/billing/dto/billing.dto'
import { auditLogService } from '@/server/services/audit-log.service'
import type { Prisma } from '@prisma/client'

type InvoiceRecord = Awaited<ReturnType<typeof invoiceRepository.findBySubscriptionId>>[number]
type InvoiceListRecord = Awaited<ReturnType<typeof invoiceRepository.findAll>>[number]

function getInvoiceNotes(metadata: Prisma.JsonValue | null): string {
  if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata) || !('notes' in metadata)) return ''
  const notes = metadata.notes
  return notes === null ? '' : String(notes)
}

export interface InvoiceManagementQueryDTO {
  status?: 'DRAFT' | 'SENT' | 'PAID' | 'FAILED' | 'CANCELLED' | 'ALL'
  search?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

export interface InvoiceManagementActor {
  id: string
  role?: string | null
}

export interface InvoiceListItemDTO extends InvoiceDTO {
  studentName: string
  studentEmail: string
  planName: string
  subscriptionStatus: string
  notes?: string
  taxAmount: number
}

export interface InvoiceDirectoryDTO extends InvoiceListDTO {
  invoices: InvoiceListItemDTO[]
}

export class InvoiceManagementService {
  async getInvoices(query: InvoiceManagementQueryDTO = {}): Promise<InvoiceDirectoryDTO> {
    const invoices = await invoiceRepository.findAll()
    const mapped = invoices
      .map((invoice) => this.mapToListItem(invoice))
      .filter((invoice) => this.matchesQuery(invoice, query))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const start = (page - 1) * pageSize
    const paged = mapped.slice(start, start + pageSize)

    return {
      invoices: paged,
      total: mapped.length,
    }
  }

  async getInvoice(id: string): Promise<InvoiceListItemDTO | null> {
    const invoice = await invoiceRepository.findById(id)
    if (!invoice) {
      return null
    }

    const dto = this.mapToListItem(invoice)
    await auditLogService.recordEvent({
      actorId: 'system',
      actorRole: 'SYSTEM',
      action: 'invoice.viewed',
      entityType: 'Invoice',
      entityId: id,
    })

    return dto
  }

  async markPaid(id: string, actor: InvoiceManagementActor): Promise<InvoiceDTO> {
    const invoice = await invoiceRepository.markAsPaid(id)
    await auditLogService.recordEvent({
      actorId: actor.id,
      actorRole: actor.role ?? null,
      action: 'invoice.marked_paid',
      entityType: 'Invoice',
      entityId: id,
    })
    return this.mapToDTO(invoice)
  }

  async cancelInvoice(id: string, actor: InvoiceManagementActor): Promise<InvoiceDTO> {
    const invoice = await invoiceRepository.update(id, { status: 'CANCELLED' })
    await auditLogService.recordEvent({
      actorId: actor.id,
      actorRole: actor.role ?? null,
      action: 'invoice.cancelled',
      entityType: 'Invoice',
      entityId: id,
    })
    return this.mapToDTO(invoice)
  }

  async voidInvoice(id: string, actor: InvoiceManagementActor): Promise<InvoiceDTO> {
    const invoice = await invoiceRepository.update(id, { status: 'CANCELLED' })
    await auditLogService.recordEvent({
      actorId: actor.id,
      actorRole: actor.role ?? null,
      action: 'invoice.voided',
      entityType: 'Invoice',
      entityId: id,
    })
    return this.mapToDTO(invoice)
  }

  private matchesQuery(invoice: InvoiceListItemDTO, query: InvoiceManagementQueryDTO): boolean {
    const normalized = query.search?.trim().toLowerCase()
    if (normalized) {
      const haystack = [invoice.invoiceNumber, invoice.studentName, invoice.studentEmail, invoice.planName].join(' ').toLowerCase()
      if (!haystack.includes(normalized)) {
        return false
      }
    }

    if (query.status && query.status !== 'ALL' && invoice.status !== query.status) {
      return false
    }

    if (query.startDate && invoice.createdAt < new Date(query.startDate)) {
      return false
    }

    if (query.endDate && invoice.createdAt > new Date(query.endDate)) {
      return false
    }

    return true
  }

  private mapToListItem(invoice: InvoiceListRecord): InvoiceListItemDTO {
    const subscription = invoice.subscription
    const user = subscription?.user
    const planName = subscription?.subscriptionPlan?.name ?? 'Unknown plan'

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      subscriptionId: invoice.subscriptionId,
      status: invoice.status,
      amount: Number(invoice.amount ?? 0),
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      paidAt: invoice.paidAt,
      description: invoice.description ?? undefined,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      studentName: user?.displayName ?? user?.email ?? 'Unknown student',
      studentEmail: user?.email ?? '',
      planName,
      subscriptionStatus: subscription?.status ?? 'UNKNOWN',
      notes: getInvoiceNotes(invoice.metadata),
      taxAmount: 0,
    }
  }

  private mapToDTO(invoice: InvoiceRecord): InvoiceDTO {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      subscriptionId: invoice.subscriptionId,
      status: invoice.status,
      amount: Number(invoice.amount ?? 0),
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      paidAt: invoice.paidAt,
      description: invoice.description ?? undefined,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    }
  }
}

export const invoiceManagementService = new InvoiceManagementService()
