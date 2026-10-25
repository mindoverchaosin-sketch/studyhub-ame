import { z } from 'zod'
import { categoryRepository } from '@/server/repositories/category.repository'

export const categoryCreationSchema = z.object({
  title: z.string().trim().min(1, 'Category title is required.').max(120, 'Category title is too long.'),
  slug: z.string()
    .trim()
    .toLowerCase()
    .min(1, 'Category slug is required.')
    .max(100, 'Category slug is too long.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and single hyphens in the slug.'),
  description: z.string().trim().max(2000, 'Category description is too long.').transform((value) => value || null),
})

export type CategoryCreationInput = z.infer<typeof categoryCreationSchema>

export function isCategoryManagementAvailable(): boolean {
  return process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV !== 'production'
}

export async function getManagedCategories() {
  return categoryRepository.findActive()
}

export async function createManagedCategory(input: CategoryCreationInput) {
  return categoryRepository.create(input)
}
