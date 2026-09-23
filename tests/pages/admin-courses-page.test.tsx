import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  redirect: vi.fn((location: string): never => { throw new Error(`REDIRECT:${location}`) }),
  getAdminCourses: vi.fn(),
  PageHeader: vi.fn(() => <div data-testid="page-header" />),
  AdminCoursesTable: vi.fn(() => <div data-testid="admin-courses-table" />),
  Container: vi.fn(({ children }: { children: React.ReactNode }) => <div data-testid="container">{children}</div>),
  Section: vi.fn(({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) => <div data-testid="section" {...props}>{children}</div>),
}))

vi.mock('@/auth', () => ({ requirePermission: mocks.requirePermission }))
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }))
vi.mock('@/server/services/course.service', () => ({ getAdminCourses: mocks.getAdminCourses }))
vi.mock('@/features/admin/components/PageHeader', () => ({ default: mocks.PageHeader }))
vi.mock('@/features/admin/components/AdminCoursesTable', () => ({ default: mocks.AdminCoursesTable }))
vi.mock('@/components/ui/Container', () => ({ default: mocks.Container }))
vi.mock('@/components/ui/Section', () => ({ default: mocks.Section }))

describe('AdminCoursesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requirePermission.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } })
    mocks.getAdminCourses.mockResolvedValue([])
  })

  it('redirects to login when unauthenticated or unauthorized', async () => {
    mocks.requirePermission.mockRejectedValueOnce(new Error('denied'))

    const { default: AdminCoursesPage } = await import('@/app/(admin)/admin/courses/page')
    await expect(AdminCoursesPage()).rejects.toThrow('REDIRECT:/login')
    expect(mocks.requirePermission).toHaveBeenCalledWith('manageCourses')
    expect(mocks.getAdminCourses).not.toHaveBeenCalled()
  })

  it('renders the page for an authorized admin', async () => {
    const { default: AdminCoursesPage } = await import('@/app/(admin)/admin/courses/page')
    const result = await AdminCoursesPage()

    expect(mocks.requirePermission).toHaveBeenCalledWith('manageCourses')
    expect(mocks.getAdminCourses).toHaveBeenCalled()

    render(result)
    expect(screen.getByText('No courses available')).toBeInTheDocument()
  })
})
