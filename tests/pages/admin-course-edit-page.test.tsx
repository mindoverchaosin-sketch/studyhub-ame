import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  getAdminCourseById: vi.fn(),
  redirect: vi.fn((path: string): never => { throw new Error(`REDIRECT:${path}`) }),
  notFound: vi.fn((): never => { throw new Error('NOT_FOUND') }),
}))

vi.mock('@/auth', () => ({ requirePermission: mocks.requirePermission }))
vi.mock('next/navigation', () => ({ redirect: mocks.redirect, notFound: mocks.notFound }))
vi.mock('@/server/services/course.service', () => ({ getAdminCourseById: mocks.getAdminCourseById }))
vi.mock('@/server/actions/course-management.actions', () => ({ updateAdminCourseAction: vi.fn() }))

import AdminCourseEditPage from '@/app/(admin)/admin/courses/[courseId]/page'

const existingCourse = {
  id: 'course-db-id',
  title: 'DGCA Airframe',
  slug: 'dgca-airframe',
  description: 'Existing course description',
  categoryId: 'category-dgca',
  categoryTitle: 'DGCA',
  status: 'PUBLISHED' as const,
  publishedAt: new Date('2026-01-01T00:00:00.000Z'),
  isPremium: true,
  createdAt: new Date('2025-12-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  _count: { modules: 1 },
  modules: [{ id: 'module-db-id', title: 'Airframe Structures', slug: 'airframe-structures', moduleNumber: '1', status: 'PUBLISHED', displayOrder: 1 }],
}

describe('AdminCourseEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requirePermission.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } })
    mocks.getAdminCourseById.mockResolvedValue(existingCourse)
  })

  it('loads the existing course by database ID and shows its details and modules', async () => {
    const page = await AdminCourseEditPage({ params: Promise.resolve({ courseId: 'course-db-id' }) })
    render(page)

    expect(mocks.requirePermission).toHaveBeenCalledWith('manageCourses')
    expect(mocks.getAdminCourseById).toHaveBeenCalledWith('course-db-id')
    expect(screen.getByRole('textbox', { name: 'Course title' })).toHaveValue('DGCA Airframe')
    expect(screen.getByRole('textbox', { name: 'Slug' })).toHaveValue('dgca-airframe')
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue('Existing course description')
    expect(within(screen.getByRole('region', { name: 'Course classification' })).getByText('PUBLISHED')).toBeInTheDocument()
    expect(screen.getByText('DGCA')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Airframe Structures' })).toHaveAttribute('href', '/admin/modules/module-db-id')
    expect(screen.getByRole('link', { name: 'Back to courses' })).toHaveAttribute('href', '/admin/courses')
  })

  it('redirects callers without course-management permission', async () => {
    mocks.requirePermission.mockRejectedValueOnce(new Error('denied'))

    await expect(AdminCourseEditPage({ params: Promise.resolve({ courseId: 'course-db-id' }) })).rejects.toThrow('REDIRECT:/login')
    expect(mocks.getAdminCourseById).not.toHaveBeenCalled()
  })

  it('returns not found for an unknown course ID', async () => {
    mocks.getAdminCourseById.mockResolvedValueOnce(null)

    await expect(AdminCourseEditPage({ params: Promise.resolve({ courseId: 'missing-id' }) })).rejects.toThrow('NOT_FOUND')
    expect(mocks.getAdminCourseById).toHaveBeenCalledWith('missing-id')
  })
})