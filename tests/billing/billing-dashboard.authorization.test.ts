import { describe, expect, it } from 'vitest'
import { permissionService } from '@/server/services/permission.service'

describe('Billing dashboard authorization', () => {
  it('allows finance managers to view billing analytics', () => {
    expect(permissionService.hasPermission('FINANCE_MANAGER', 'viewBillingAnalytics')).toBe(true)
  })

  it('denies students from viewing billing analytics', () => {
    expect(permissionService.hasPermission('STUDENT', 'viewBillingAnalytics')).toBe(false)
  })
})
