import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const { requireApprovedRole, listUsers } = vi.hoisted(() => ({
  requireApprovedRole: vi.fn().mockResolvedValue(undefined),
  listUsers: vi.fn().mockResolvedValue({
    items: [],
    totalItems: 41,
    page: 2,
    pageSize: 20,
    totalPages: 3,
  }),
}))

vi.mock('@/auth', () => ({ requireApprovedRole }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('next/link', () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }))
vi.mock('@/components/super-admin/AddUserDialog', () => ({ default: () => null }))
vi.mock('@/components/super-admin/SuperAdminPageHeader', () => ({ default: () => null }))
vi.mock('@/server/services/user-management.service', () => ({ listUsers }))

import SuperAdminUsersPage from '@/app/super-admin/(portal)/users/page'

describe('Super Admin users page filters', () => {
  it('forwards role, account, and approval filters and preserves them in pagination links', async () => {
    const page = await SuperAdminUsersPage({
      searchParams: Promise.resolve({
        query: 'pending example',
        role: 'ADMIN',
        status: 'SUSPENDED',
        approvalStatus: 'PENDING',
        page: '2',
      }),
    })

    render(page)

    expect(requireApprovedRole).toHaveBeenCalledWith('SUPER_ADMIN')
    expect(listUsers).toHaveBeenCalledWith({
      search: 'pending example',
      role: 'ADMIN',
      status: 'SUSPENDED',
      approvalStatus: 'PENDING',
      page: 2,
      pageSize: 20,
    })
    expect(screen.getByRole('combobox', { name: 'Role' })).toHaveValue('ADMIN')
    expect(screen.getByRole('combobox', { name: 'Account status' })).toHaveValue('SUSPENDED')
    expect(screen.getByRole('combobox', { name: 'Approval status' })).toHaveValue('PENDING')
    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
      'href',
      '/super-admin/users?query=pending+example&role=ADMIN&status=SUSPENDED&approvalStatus=PENDING&page=3',
    )
  })
})