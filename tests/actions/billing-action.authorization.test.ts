import { beforeEach, describe, expect, it, vi } from 'vitest'

const requireStudentMock = vi.hoisted(() => vi.fn())
const requireOwnershipMock = vi.hoisted(() => vi.fn())
const billingFacadeServiceMock = vi.hoisted(() => ({
  getStudentBillingOverview: vi.fn(),
}))

vi.mock('@/auth', () => ({
  requireStudent: requireStudentMock,
  requireOwnership: requireOwnershipMock,
}))

vi.mock('@/server/services/billing-facade.service', () => ({
  billingFacadeService: billingFacadeServiceMock,
}))

import { getStudentBillingOverviewAction } from '@/server/actions/billing.actions'

describe('billing actions authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requires the user to be authenticated as a student', async () => {
    requireStudentMock.mockRejectedValue(new Error('Unauthorized'))

    await expect(getStudentBillingOverviewAction('user-1')).rejects.toThrow('Unauthorized')
    expect(requireStudentMock).toHaveBeenCalled()
  })

  it('requires ownership before returning the billing overview', async () => {
    requireStudentMock.mockResolvedValue({ user: { id: 'user-1', role: 'STUDENT' } })
    requireOwnershipMock.mockImplementation(() => undefined)
    billingFacadeServiceMock.getStudentBillingOverview.mockResolvedValue({ currentSubscription: null, entitlements: { features: [], subscriptionStatus: null }, invoices: [], availablePlans: [] })

    const result = await getStudentBillingOverviewAction('user-1')

    expect(requireOwnershipMock).toHaveBeenCalledWith('user-1', 'user-1')
    expect(result).toHaveProperty('availablePlans')
  })
})
