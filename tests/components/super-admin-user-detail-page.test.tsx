import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requireApprovedRole, getUserManagementDetail } = vi.hoisted(() => ({
  requireApprovedRole: vi.fn(),
  getUserManagementDetail: vi.fn(),
}))

vi.mock('@/auth', () => ({ requireApprovedRole }))
vi.mock('next/navigation', () => ({
  redirect: (path: string) => { throw new Error(`redirect:${path}`) },
  notFound: () => { throw new Error('notFound') },
}))
vi.mock('next/link', () => ({ default: () => null }))
vi.mock('@/components/super-admin/SuperAdminPageHeader', () => ({ default: () => null }))
vi.mock('@/components/super-admin/UserLifecycleControls', () => ({ default: () => null }))
vi.mock('@/server/services/user-management.service', () => ({ getUserManagementDetail }))

import SuperAdminUserDetailPage from '@/app/super-admin/(portal)/users/[userId]/page'

describe('Super Admin user detail access gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireApprovedRole.mockRejectedValue(new Error('Insufficient role.'))
  })

  it('redirects unauthorized roles before loading account details or lifecycle controls', async () => {
    await expect(SuperAdminUserDetailPage({ params: Promise.resolve({ userId: 'user-1' }) }))
      .rejects.toThrow('redirect:/unauthorized?reason=access-denied')

    expect(requireApprovedRole).toHaveBeenCalledWith('SUPER_ADMIN')
    expect(getUserManagementDetail).not.toHaveBeenCalled()
  })
})