import { describe, expect, it } from 'vitest'
import { permissionService } from '@/server/services/permission.service'

describe('Billing dashboard authorization', () => {
  it('allows admins and super admins to view billing analytics', () => {
    expect(permissionService.hasPermission('ADMIN', 'viewBillingAnalytics')).toBe(true)
    expect(permissionService.hasPermission('SUPER_ADMIN', 'viewBillingAnalytics')).toBe(true)
  })

  it('denies students from viewing billing analytics', () => {
    expect(permissionService.hasPermission('STUDENT', 'viewBillingAnalytics')).toBe(false)
  })

  it('denies content editors from viewing billing analytics', () => {
    expect(permissionService.hasPermission('CONTENT_EDITOR', 'viewBillingAnalytics')).toBe(false)
  })
})
