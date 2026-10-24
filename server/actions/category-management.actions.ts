'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ForbiddenError, requireApprovedRole } from '@/auth'
import { withAuditLogging } from '@/server/actions/audit-helpers'
import {
  categoryCreationSchema,
  createManagedCategory,
  isCategoryManagementAvailable,
} from '@/server/services/category-management.service'

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
}

export async function createCategoryAction(formData: FormData) {
  await requireApprovedRole('SUPER_ADMIN')
  if (!isCategoryManagementAvailable()) {
    throw new ForbiddenError('Category management is disabled in production.')
  }

  const parsed = categoryCreationSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description') ?? '',
  })
  if (!parsed.success) redirect('/super-admin/categories?error=invalid')

  try {
    await withAuditLogging({
      permission: 'manageCourses',
      action: 'category.create',
      entityType: 'CATEGORY',
      metadata: { source: 'super-admin-categories' },
      run: () => createManagedCategory(parsed.data),
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) redirect('/super-admin/categories?error=duplicate')
    throw error
  }

  revalidatePath('/super-admin/categories')
  revalidatePath('/admin/courses')
  revalidatePath('/admin/courses/new')
  redirect('/super-admin/categories?created=1')
}
