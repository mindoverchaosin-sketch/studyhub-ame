import { beforeEach, describe, expect, it, vi } from 'vitest'

const invoiceRepositoryMock = vi.hoisted(() => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  markAsPaid: vi.fn(),
  update: vi.fn(),
}))

const auditLogServiceMock = vi.hoisted(() => ({
  recordEvent: vi.fn(),
}))

vi.mock('@/server/domains/billing/invoices/invoice.repository', () => ({
  invoiceRepository: invoiceRepositoryMock,
}))

vi.mock('@/server/services/audit-log.service', () => ({
  auditLogService: auditLogServiceMock,
}))

import { InvoiceManagementService } from '@/server/services/invoice-management.service'

describe('InvoiceManagementService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a filtered and paginated invoice directory', async () => {
    invoiceRepositoryMock.findAll.mockResolvedValue([
      {
        id: 'inv-1',
        invoiceNumber: 'INV-001',
        subscriptionId: 'sub-1',
        status: 'PAID',
        amount: 499,
        currency: 'INR',
        dueDate: new Date('2024-02-01'),
        paidAt: new Date('2024-02-02'),
        description: 'Monthly subscription',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-02-02'),
        subscription: {
          status: 'ACTIVE',
          subscriptionPlan: { name: 'Monthly' },
          user: { displayName: 'Asha', email: 'asha@example.com' },
        },
      },
    ])

    const service = new InvoiceManagementService()
    const result = await service.getInvoices({ search: 'asha', status: 'PAID', page: 1, pageSize: 10 })

    expect(result.invoices).toHaveLength(1)
    expect(result.invoices[0].invoiceNumber).toBe('INV-001')
    expect(result.total).toBe(1)
  })

  it('marks an invoice paid and records audit logging', async () => {
    invoiceRepositoryMock.markAsPaid.mockResolvedValue({
      id: 'inv-1',
      invoiceNumber: 'INV-001',
      subscriptionId: 'sub-1',
      status: 'PAID',
      amount: 499,
      currency: 'INR',
      dueDate: new Date('2024-02-01'),
      paidAt: new Date('2024-02-02'),
      description: 'Monthly subscription',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-02-02'),
    })

    const service = new InvoiceManagementService()
    const result = await service.markPaid('inv-1', { id: 'admin-1', role: 'FINANCE_MANAGER' })

    expect(result.status).toBe('PAID')
    expect(auditLogServiceMock.recordEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'invoice.marked_paid' }))
  })

  it('cancels and voids invoices with audit logging', async () => {
    invoiceRepositoryMock.update.mockResolvedValue({
      id: 'inv-2',
      invoiceNumber: 'INV-002',
      subscriptionId: 'sub-2',
      status: 'CANCELLED',
      amount: 499,
      currency: 'INR',
      dueDate: new Date('2024-02-01'),
      paidAt: null,
      description: 'Monthly subscription',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-02-02'),
    })

    const service = new InvoiceManagementService()
    await service.cancelInvoice('inv-2', { id: 'admin-1', role: 'SUPER_ADMIN' })
    await service.voidInvoice('inv-2', { id: 'admin-1', role: 'SUPER_ADMIN' })

    expect(auditLogServiceMock.recordEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'invoice.cancelled' }))
    expect(auditLogServiceMock.recordEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'invoice.voided' }))
  })
})
