import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  getAdminCourseCategories: vi.fn(),
  redirect: vi.fn((path: string): never => { throw new Error(`REDIRECT:${path}`) }),
  PageHeader: vi.fn(() => <div data-testid="page-header" />),
  createAdminCourseAction: vi.fn(),
}))

vi.mock('@/auth', () => ({ requirePermission: mocks.requirePermission }))
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }))
vi.mock('@/server/services/course.service', () => ({ getAdminCourseCategories: mocks.getAdminCourseCategories }))
vi.mock('@/server/actions/course-management.actions', () => ({ createAdminCourseAction: mocks.createAdminCourseAction }))
vi.mock('@/features/admin/components/PageHeader', () => ({ default: mocks.PageHeader }))

import AdminCourseCreatePage from '@/app/(admin)/admin/courses/new/page'

describe('AdminCourseCreatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requirePermission.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } })
    mocks.getAdminCourseCategories.mockResolvedValue([{ id: 'category-dgca', title: 'DGCA' }])
  })

  it('requires course-management permission and renders existing category options', async () => {
    const page = await AdminCourseCreatePage({})
    render(page)

    expect(mocks.requirePermission).toHaveBeenCalledWith('manageCourses')
    expect(screen.getByRole('textbox', { name: 'Course title' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue('')
    expect(screen.getByRole('option', { name: 'DGCA' })).toHaveValue('category-dgca')
    expect(screen.getByRole('button', { name: 'Create draft course' })).toBeInTheDocument()
  })

  it('redirects unauthorized users before loading categories', async () => {
    mocks.requirePermission.mockRejectedValueOnce(new Error('denied'))

    await expect(AdminCourseCreatePage({})).rejects.toThrow('REDIRECT:/login')
    expect(mocks.getAdminCourseCategories).not.toHaveBeenCalled()
  })
})
