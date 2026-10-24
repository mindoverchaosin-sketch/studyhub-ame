import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const { requireApprovedRole, getManagedCategories, isCategoryManagementAvailable } = vi.hoisted(() => ({
  requireApprovedRole: vi.fn().mockResolvedValue({ user: { role: 'SUPER_ADMIN' } }),
  getManagedCategories: vi.fn().mockResolvedValue([]),
  isCategoryManagementAvailable: vi.fn().mockReturnValue(true),
}))

vi.mock('@/auth', () => ({ requireApprovedRole }))
vi.mock('@/server/services/category-management.service', () => ({
  getManagedCategories,
  isCategoryManagementAvailable,
}))
vi.mock('@/server/actions/category-management.actions', () => ({ createCategoryAction: vi.fn() }))
vi.mock('@/components/super-admin/SuperAdminPageHeader', () => ({ default: () => null }))

import SuperAdminCategoriesPage from '@/app/super-admin/(portal)/categories/page'

describe('Super Admin categories page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireApprovedRole.mockResolvedValue({ user: { role: 'SUPER_ADMIN' } })
    getManagedCategories.mockResolvedValue([])
    isCategoryManagementAvailable.mockReturnValue(true)
  })

  it('requires Super Admin and renders active categories with a validated creation form', async () => {
    getManagedCategories.mockResolvedValueOnce([
      { id: 'category-1', title: 'DGCA Aviation', slug: 'dgca-aviation', description: 'Preview test' },
    ])

    render(await SuperAdminCategoriesPage({}))

    expect(requireApprovedRole).toHaveBeenCalledWith('SUPER_ADMIN')
    expect(screen.getByRole('textbox', { name: 'Category title' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /^Slug/ })).toHaveAttribute('maxLength', '100')
    expect(screen.getByText('DGCA Aviation')).toBeInTheDocument()
    expect(screen.getByText('dgca-aviation')).toBeInTheDocument()
  })

  it('does not load categories or render a creation form in Production', async () => {
    isCategoryManagementAvailable.mockReturnValueOnce(false)

    render(await SuperAdminCategoriesPage({}))

    expect(screen.getByRole('status')).toHaveTextContent('Category creation is disabled in Production')
    expect(screen.queryByRole('button', { name: 'Create category' })).not.toBeInTheDocument()
    expect(getManagedCategories).not.toHaveBeenCalled()
  })

  it('displays invalid and duplicate slug feedback', async () => {
    render(await SuperAdminCategoriesPage({
      searchParams: Promise.resolve({ error: 'duplicate' }),
    }))

    expect(screen.getByRole('alert')).toHaveTextContent('That slug is already in use')
  })
})
