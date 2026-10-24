import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { findActive, create } = vi.hoisted(() => ({
  findActive: vi.fn(),
  create: vi.fn(),
}))

vi.mock('@/server/repositories/category.repository', () => ({
  categoryRepository: { findActive, create },
}))

import {
  categoryCreationSchema,
  createManagedCategory,
  getManagedCategories,
  isCategoryManagementAvailable,
} from '@/server/services/category-management.service'

describe('category management service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('allows category management in Preview and blocks it in Production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('VERCEL_ENV', '')
    expect(isCategoryManagementAvailable()).toBe(false)

    vi.stubEnv('VERCEL_ENV', 'preview')
    expect(isCategoryManagementAvailable()).toBe(true)

    vi.stubEnv('VERCEL_ENV', 'production')
    expect(isCategoryManagementAvailable()).toBe(false)
  })

  it('lists only categories provided by the active-category repository query', async () => {
    findActive.mockResolvedValue([{ id: 'category-1', title: 'DGCA', slug: 'dgca', description: null }])

    await expect(getManagedCategories()).resolves.toEqual([
      { id: 'category-1', title: 'DGCA', slug: 'dgca', description: null },
    ])
    expect(findActive).toHaveBeenCalledOnce()
  })

  it('creates a category with a normalized slug and nullable empty description', async () => {
    create.mockResolvedValue({ id: 'category-1', title: 'DGCA', slug: 'dgca-aviation', description: null })
    const input = categoryCreationSchema.parse({ title: ' DGCA ', slug: 'DGCA-Aviation', description: ' ' })

    await expect(createManagedCategory(input)).resolves.toMatchObject({
      id: 'category-1',
      slug: 'dgca-aviation',
      description: null,
    })
    expect(create).toHaveBeenCalledWith({ title: 'DGCA', slug: 'dgca-aviation', description: null })
  })

  it('rejects malformed slugs and overlong descriptions', () => {
    expect(categoryCreationSchema.safeParse({ title: 'DGCA', slug: 'bad slug', description: '' }).success).toBe(false)
    expect(categoryCreationSchema.safeParse({
      title: 'DGCA',
      slug: 'dgca',
      description: 'x'.repeat(2001),
    }).success).toBe(false)
  })
})
