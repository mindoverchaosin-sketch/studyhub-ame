import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  withAuditLogging: vi.fn(),
  createAdminCourse: vi.fn(),
  getAdminCourseCategories: vi.fn(),
  setAdminCoursePublishState: vi.fn(),
  updateAdminCourseById: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn((path: string): never => { throw new Error(`REDIRECT:${path}`) }),
  notFound: vi.fn((): never => { throw new Error('NOT_FOUND') }),
}))

vi.mock('@/auth', () => ({
  requirePermission: mocks.requirePermission,
  NotFoundError: class NotFoundError extends Error {},
}))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock('next/navigation', () => ({ redirect: mocks.redirect, notFound: mocks.notFound }))
vi.mock('@/server/actions/audit-helpers', () => ({ withAuditLogging: mocks.withAuditLogging }))
vi.mock('@/server/services/course.service', () => ({
  createAdminCourse: mocks.createAdminCourse,
  getAdminCourseCategories: mocks.getAdminCourseCategories,
  setAdminCoursePublishState: mocks.setAdminCoursePublishState,
  updateAdminCourseById: mocks.updateAdminCourseById,
}))

import { updateAdminCourseAction } from '@/server/actions/course-management.actions'

function makeForm(values: Record<string, string>) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(values)) formData.set(key, value)
  return formData
}

const validForm = () => makeForm({
  title: 'Updated DGCA Airframe',
  slug: 'dgca-airframe',
  description: 'Safe title update',
})

describe('updateAdminCourseAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requirePermission.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } })
    mocks.getAdminCourseCategories.mockResolvedValue([{ id: 'category-dgca', title: 'DGCA' }])
    mocks.createAdminCourse.mockResolvedValue({ id: 'created-course-id' })
    mocks.setAdminCoursePublishState.mockResolvedValue({ id: 'course-db-id' })
    mocks.updateAdminCourseById.mockResolvedValue({ id: 'course-db-id', title: 'Updated DGCA Airframe' })
    mocks.withAuditLogging.mockImplementation(async (input: { run: () => Promise<unknown> }) => input.run())
  })

  it('authorizes, validates, updates by database ID, audits, revalidates, and returns to the edit page', async () => {
    await expect(updateAdminCourseAction('course-db-id', validForm())).rejects.toThrow('REDIRECT:/admin/courses/course-db-id?saved=1')

    expect(mocks.requirePermission).toHaveBeenCalledWith('manageCourses')
    expect(mocks.withAuditLogging).toHaveBeenCalledWith(expect.objectContaining({
      permission: 'manageCourses',
      action: 'course.update',
      entityType: 'COURSE',
      entityId: 'course-db-id',
    }))
    expect(mocks.updateAdminCourseById).toHaveBeenCalledWith('course-db-id', {
      title: 'Updated DGCA Airframe',
      slug: 'dgca-airframe',
      description: 'Safe title update',
    })
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/admin/courses')
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/admin/courses/course-db-id')
  })

  it('rejects unauthorized update attempts before mutation', async () => {
    mocks.requirePermission.mockRejectedValueOnce(new Error('denied'))

    await expect(updateAdminCourseAction('course-db-id', validForm())).rejects.toThrow('denied')
    expect(mocks.updateAdminCourseById).not.toHaveBeenCalled()
  })

  it('redirects invalid form input without updating the course', async () => {
    const invalid = makeForm({ title: '', slug: '', description: '' })

    await expect(updateAdminCourseAction('course-db-id', invalid)).rejects.toThrow('REDIRECT:/admin/courses/course-db-id?error=invalid')
    expect(mocks.updateAdminCourseById).not.toHaveBeenCalled()
  })

  it('returns not found when the ID does not exist', async () => {
    mocks.updateAdminCourseById.mockResolvedValueOnce(null)

    await expect(updateAdminCourseAction('missing-id', validForm())).rejects.toThrow('NOT_FOUND')
  })

  it('returns a field-level slug conflict message for duplicate slugs', async () => {
    mocks.withAuditLogging.mockImplementationOnce(async () => { throw { code: 'P2002' } })

    await expect(updateAdminCourseAction('course-db-id', validForm())).rejects.toThrow('REDIRECT:/admin/courses/course-db-id?error=slug')
  })

  it('creates an audited draft course with the selected category', async () => {
    const { createAdminCourseAction } = await import('@/server/actions/course-management.actions')
    const formData = makeForm({
      title: 'DGCA Airframe',
      slug: 'dgca-airframe',
      description: 'Airframe course',
      categoryId: 'category-dgca',
    })

    await expect(createAdminCourseAction(formData)).rejects.toThrow('REDIRECT:/admin/courses/created-course-id?created=1')

    expect(mocks.createAdminCourse).toHaveBeenCalledWith({
      title: 'DGCA Airframe',
      slug: 'dgca-airframe',
      description: 'Airframe course',
      categoryId: 'category-dgca',
    })
    expect(mocks.withAuditLogging).toHaveBeenCalledWith(expect.objectContaining({
      action: 'course.create',
      entityType: 'COURSE',
    }))
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/student/courses')
  })

  it('rejects category IDs that are not active categories', async () => {
    const { createAdminCourseAction } = await import('@/server/actions/course-management.actions')

    await expect(createAdminCourseAction(makeForm({
      title: 'DGCA Airframe',
      slug: 'dgca-airframe',
      description: '',
      categoryId: 'missing-category',
    }))).rejects.toThrow('REDIRECT:/admin/courses/new?error=category')

    expect(mocks.createAdminCourse).not.toHaveBeenCalled()
  })

  it('audits and revalidates course publication state changes', async () => {
    const { setAdminCoursePublishStateAction } = await import('@/server/actions/course-management.actions')

    await setAdminCoursePublishStateAction('course-db-id', 'PUBLISHED')

    expect(mocks.setAdminCoursePublishState).toHaveBeenCalledWith('course-db-id', 'PUBLISHED')
    expect(mocks.withAuditLogging).toHaveBeenCalledWith(expect.objectContaining({
      action: 'course.publish',
      entityType: 'COURSE',
      entityId: 'course-db-id',
    }))
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/admin/courses')
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/student/courses')
  })
})