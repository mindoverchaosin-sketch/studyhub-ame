import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireApprovedRole: vi.fn(),
  withAuditLogging: vi.fn(),
  createManagedCategory: vi.fn(),
  isCategoryManagementAvailable: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn((path: string): never => { throw new Error(`REDIRECT:${path}`) }),
}))

vi.mock('@/auth', () => ({
  requireApprovedRole: mocks.requireApprovedRole,
  ForbiddenError: class ForbiddenError extends Error {},
}))
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }))
vi.mock('@/server/actions/audit-helpers', () => ({ withAuditLogging: mocks.withAuditLogging }))
vi.mock('@/server/services/category-management.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/services/category-management.service')>()
  return {
    ...actual,
    createManagedCategory: mocks.createManagedCategory,
    isCategoryManagementAvailable: mocks.isCategoryManagementAvailable,
  }
})

import { createCategoryAction } from '@/server/actions/category-management.actions'

function makeForm(values: Record<string, string>) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(values)) formData.set(key, value)
  return formData
}

const validForm = () => makeForm({
  title: '  DGCA Aviation  ',
  slug: 'DGCA-Aviation',
  description: '  Preview-only test category  ',
})

describe('createCategoryAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireApprovedRole.mockResolvedValue({ user: { id: 'super-1', role: 'SUPER_ADMIN' } })
    mocks.isCategoryManagementAvailable.mockReturnValue(true)
    mocks.createManagedCategory.mockResolvedValue({ id: 'category-1', title: 'DGCA Aviation', slug: 'dgca-aviation' })
    mocks.withAuditLogging.mockImplementation(async ({ run }: { run: () => Promise<unknown> }) => run())
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('requires Super Admin, validates normalized fields, audits creation, and refreshes course forms', async () => {
    await expect(createCategoryAction(validForm())).rejects.toThrow('REDIRECT:/super-admin/categories?created=1')

    expect(mocks.requireApprovedRole).toHaveBeenCalledWith('SUPER_ADMIN')
    expect(mocks.withAuditLogging).toHaveBeenCalledWith(expect.objectContaining({
      permission: 'manageCourses',
      action: 'category.create',
      entityType: 'CATEGORY',
      metadata: { source: 'super-admin-categories' },
    }))
    expect(mocks.createManagedCategory).toHaveBeenCalledWith({
      title: 'DGCA Aviation',
      slug: 'dgca-aviation',
      description: 'Preview-only test category',
    })
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/admin/courses/new')
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/super-admin/categories')
  })

  it('does not mutate when the caller is not a Super Admin', async () => {
    mocks.requireApprovedRole.mockRejectedValueOnce(new Error('denied'))

    await expect(createCategoryAction(validForm())).rejects.toThrow('denied')
    expect(mocks.createManagedCategory).not.toHaveBeenCalled()
    expect(mocks.withAuditLogging).not.toHaveBeenCalled()
  })

  it('blocks category creation when Vercel reports a Production deployment', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    mocks.isCategoryManagementAvailable.mockReturnValue(false)

    await expect(createCategoryAction(validForm())).rejects.toThrow('Category management is disabled in production.')
    expect(mocks.createManagedCategory).not.toHaveBeenCalled()
    expect(mocks.withAuditLogging).not.toHaveBeenCalled()
  })

  it('rejects invalid fields before mutation', async () => {
    await expect(createCategoryAction(makeForm({ title: '', slug: 'Bad Slug', description: '' })))
      .rejects.toThrow('REDIRECT:/super-admin/categories?error=invalid')
    expect(mocks.createManagedCategory).not.toHaveBeenCalled()
  })

  it('shows a field-level message when the category slug is already in use', async () => {
    mocks.withAuditLogging.mockRejectedValueOnce({ code: 'P2002' })

    await expect(createCategoryAction(validForm())).rejects.toThrow('REDIRECT:/super-admin/categories?error=duplicate')
  })

  it('surfaces unexpected failures instead of reporting success', async () => {
    mocks.withAuditLogging.mockRejectedValueOnce(new Error('audit storage unavailable'))

    await expect(createCategoryAction(validForm())).rejects.toThrow('audit storage unavailable')
  })
})
