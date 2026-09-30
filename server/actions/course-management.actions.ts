'use server'

import { revalidatePath } from 'next/cache'
import { notFound, redirect } from 'next/navigation'
import { NotFoundError, requirePermission } from '@/auth'
import { withAuditLogging } from '@/server/actions/audit-helpers'
import { updateAdminCourseById } from '@/server/services/course.service'
import { z } from 'zod'

const updateCourseSchema = z.object({
  title: z.string().trim().min(1, 'Course title is required.').max(200, 'Course title is too long.'),
  slug: z.string().trim().min(1, 'Course slug is required.').max(200, 'Course slug is too long.'),
  description: z.string().max(10000, 'Course description is too long.'),
})

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
}

export async function updateAdminCourseAction(courseId: string, formData: FormData) {
  await requirePermission('manageCourses')

  const coursePath = `/admin/courses/${courseId}`
  const parsed = updateCourseSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description') ?? '',
  })
  if (!parsed.success) redirect(`${coursePath}?error=invalid`)

  try {
    await withAuditLogging({
      permission: 'manageCourses',
      action: 'course.update',
      entityType: 'COURSE',
      entityId: courseId,
      metadata: { source: 'admin-courses' },
      run: async () => {
        const updated = await updateAdminCourseById(courseId, {
          ...parsed.data,
          description: parsed.data.description || null,
        })
        if (!updated) throw new NotFoundError('Course not found.')
        revalidatePath('/admin/courses')
        revalidatePath(coursePath)
        return updated
      },
    })
  } catch (error) {
    if (error instanceof NotFoundError) notFound()
    if (isUniqueConstraintError(error)) redirect(`${coursePath}?error=slug`)
    throw error
  }

  redirect(`${coursePath}?saved=1`)
}