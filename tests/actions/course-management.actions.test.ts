import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  withAuditLogging: vi.fn(),
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
vi.mock('@/server/services/course.service', () => ({ updateAdminCourseById: mocks.updateAdminCourseById }))

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
})