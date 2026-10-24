import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockFindAll, mockFindById, mockFindAdminById, mockFindCategories, mockCreate, mockUpdate, mockRequirePermission, mockRevalidatePath } = vi.hoisted(() => ({
  mockFindAll: vi.fn(),
  mockFindById: vi.fn(),
  mockFindAdminById: vi.fn(),
  mockFindCategories: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockRevalidatePath: vi.fn(),
}))

vi.mock('@/server/repositories/course.repository', () => ({
  courseRepository: {
    findAllPublished: vi.fn(),
    findAll: mockFindAll,
    findCategories: mockFindCategories,
    findBySlug: vi.fn(),
    findById: mockFindById,
    findAdminById: mockFindAdminById,
    create: mockCreate,
    update: mockUpdate,
  },
}))
vi.mock('@/auth', () => ({
  requirePermission: mockRequirePermission,
  NotFoundError: class NotFoundError extends Error {},
}))
vi.mock('@/server/actions/audit-helpers', () => ({
  withAuditLogging: async ({ run }: { run: () => Promise<unknown> }) => run(),
}))
vi.mock('next/cache', () => ({ revalidatePath: mockRevalidatePath }))
vi.mock('next/navigation', () => ({
  redirect: (path: string): never => { throw new Error(`REDIRECT:${path}`) },
  notFound: (): never => { throw new Error('NOT_FOUND') },
}))

import {
  createAdminCourse,
  getAdminCourseById,
  getAdminCourseCategories,
  setAdminCoursePublishState,
  updateAdminCourseById,
} from '@/server/services/course.service'

const publishedAt = new Date('2026-02-01T00:00:00.000Z')
let storedCourse: Record<string, unknown>

function courseRow() {
  return {
    id: 'course-db-id',
    title: 'Original course',
    slug: 'original-course',
    description: 'Original description',
    categoryId: 'category-dgca',
    category: { title: 'DGCA' },
    status: 'PUBLISHED' as const,
    publishedAt,
    isPremium: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-02-01T00:00:00.000Z'),
    deletedAt: null,
    _count: { modules: 1 },
    modules: [{ id: 'module-1', title: 'Existing module', slug: 'existing-module', moduleNumber: '1', status: 'PUBLISHED', displayOrder: 1 }],
  }
}

describe('admin course service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storedCourse = courseRow()
    mockFindAll.mockImplementation(async () => [{ ...storedCourse }])
    mockFindCategories.mockResolvedValue([{ id: 'category-dgca', title: 'DGCA' }])
    mockCreate.mockImplementation(async (input: Record<string, unknown>) => ({
      ...courseRow(),
      ...input,
      id: 'new-course-id',
      status: 'DRAFT',
      publishedAt: null,
    }))
    mockFindById.mockImplementation(async (id: string) => id === storedCourse.id ? { ...storedCourse } : null)
    mockFindAdminById.mockImplementation(async (id: string) => id === storedCourse.id ? { ...storedCourse } : null)
    mockUpdate.mockImplementation(async (id: string, changes: Record<string, unknown>) => {
      if (id !== storedCourse.id) throw new Error('Course not found')
      storedCourse = { ...storedCourse, ...changes, updatedAt: new Date('2026-03-01T00:00:00.000Z') }
      return { ...storedCourse }
    })
  })

  it('loads an existing course by database ID with its category and active modules', async () => {
    const course = await getAdminCourseById('course-db-id')

    expect(course).toMatchObject({
      id: 'course-db-id',
      categoryId: 'category-dgca',
      categoryTitle: 'DGCA',
      status: 'PUBLISHED',
      isPremium: true,
      modules: [{ id: 'module-1', title: 'Existing module' }],
    })
    expect(mockFindAdminById).toHaveBeenCalledWith('course-db-id')
  })

  it('loads active course categories for assignment', async () => {
    await expect(getAdminCourseCategories()).resolves.toEqual([{ id: 'category-dgca', title: 'DGCA' }])
    expect(mockFindCategories).toHaveBeenCalled()
  })

  it('creates a draft course with its selected category', async () => {
    await expect(createAdminCourse({
      title: 'New course',
      slug: 'new-course',
      description: 'A new draft',
      categoryId: 'category-dgca',
    })).resolves.toMatchObject({ id: 'new-course-id', status: 'DRAFT', categoryId: 'category-dgca' })

    expect(mockCreate).toHaveBeenCalledWith({
      title: 'New course',
      slug: 'new-course',
      description: 'A new draft',
      categoryId: 'category-dgca',
    })
  })

  it('updates a safe field and reloads it without changing category, publication state, premium access, or modules', async () => {
    await expect(updateAdminCourseById('course-db-id', {
      title: 'Updated course title',
      slug: 'original-course',
      description: 'Original description',
    })).resolves.toMatchObject({ title: 'Updated course title', status: 'PUBLISHED' })

    expect(mockUpdate).toHaveBeenCalledWith('course-db-id', {
      title: 'Updated course title',
      slug: 'original-course',
      description: 'Original description',
    })
    const reloaded = await getAdminCourseById('course-db-id')
    expect(reloaded).toMatchObject({
      title: 'Updated course title',
      slug: 'original-course',
      categoryId: 'category-dgca',
      categoryTitle: 'DGCA',
      status: 'PUBLISHED',
      publishedAt,
      isPremium: true,
      modules: [{ id: 'module-1', title: 'Existing module' }],
    })
    expect(mockFindById).toHaveBeenCalledWith('course-db-id')
    expect(mockFindAdminById).toHaveBeenCalledWith('course-db-id')
  })

  it('reproduces Edit, save, reload, and updated Courses list through the server action', async () => {
    mockRequirePermission.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } })
    const formData = new FormData()
    formData.set('title', 'Saved course title')
    formData.set('slug', 'original-course')
    formData.set('description', 'Original description')
    const { updateAdminCourseAction } = await import('@/server/actions/course-management.actions')

    await expect(updateAdminCourseAction('course-db-id', formData)).rejects.toThrow('REDIRECT:/admin/courses/course-db-id?saved=1')

    const reloaded = await getAdminCourseById('course-db-id')
    expect(reloaded).toMatchObject({
      title: 'Saved course title',
      categoryId: 'category-dgca',
      categoryTitle: 'DGCA',
      status: 'PUBLISHED',
      publishedAt,
      isPremium: true,
      modules: [{ id: 'module-1', title: 'Existing module' }],
    })
    const courses = await (await import('@/server/services/course.service')).getAdminCourses()
    expect(courses).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'course-db-id', title: 'Saved course title' })]))
    expect(mockRequirePermission).toHaveBeenCalledWith('manageCourses')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/courses')
  })

  it('returns null for a missing or soft-deleted course', async () => {
    await expect(getAdminCourseById('missing-course')).resolves.toBeNull()
    storedCourse = { ...courseRow(), deletedAt: new Date('2026-03-01T00:00:00.000Z') }
    await expect(getAdminCourseById('course-db-id')).resolves.toBeNull()
  })

  it('does not update a missing or soft-deleted course', async () => {
    await expect(updateAdminCourseById('missing-course', {
      title: 'Never persisted',
      slug: 'never-persisted',
      description: null,
    })).resolves.toBeNull()
    storedCourse = { ...courseRow(), deletedAt: new Date('2026-03-01T00:00:00.000Z') }
    mockFindById.mockResolvedValue({ ...storedCourse })

    await expect(updateAdminCourseById('course-db-id', {
      title: 'Never persisted',
      slug: 'never-persisted',
      description: null,
    })).resolves.toBeNull()
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('sets publication state and publishedAt without affecting category or module assignment', async () => {
    await expect(setAdminCoursePublishState('course-db-id', 'PUBLISHED')).resolves.toMatchObject({ status: 'PUBLISHED' })
    expect(mockUpdate).toHaveBeenCalledWith('course-db-id', {
      status: 'PUBLISHED',
      publishedAt: expect.any(Date),
    })

    await expect(setAdminCoursePublishState('course-db-id', 'DRAFT')).resolves.toMatchObject({ status: 'DRAFT' })
    expect(mockUpdate).toHaveBeenLastCalledWith('course-db-id', {
      status: 'DRAFT',
      publishedAt: null,
    })
    expect(storedCourse).toMatchObject({ categoryId: 'category-dgca' })
  })
})