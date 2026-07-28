import { beforeEach, describe, expect, it, vi } from 'vitest'

const requirePermissionMock = vi.hoisted(() => vi.fn())

vi.mock('@/auth', () => ({
  requirePermission: requirePermissionMock,
}))

vi.mock('@/server/services/invoice-management.service', () => ({
  invoiceManagementService: {
    getInvoices: vi.fn().mockResolvedValue({ invoices: [], total: 0 }),
    getInvoice: vi.fn().mockResolvedValue(null),
    markPaid: vi.fn(),
    cancelInvoice: vi.fn(),
    voidInvoice: vi.fn(),
  },
}))

import { getInvoices, getInvoice } from '@/server/actions/billing.actions'

describe('billing invoice authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requires manageInvoices to list invoices', async () => {
    requirePermissionMock.mockResolvedValue(undefined)

    await expect(getInvoices()).resolves.toEqual({ invoices: [], total: 0 })
    expect(requirePermissionMock).toHaveBeenCalledWith('manageInvoices')
  })

  it('requires manageInvoices to get an invoice', async () => {
    requirePermissionMock.mockResolvedValue(undefined)

    await expect(getInvoice('inv-1')).resolves.toBeNull()
    expect(requirePermissionMock).toHaveBeenCalledWith('manageInvoices')
  })
})
