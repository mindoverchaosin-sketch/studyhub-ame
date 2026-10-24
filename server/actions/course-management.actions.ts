'use server'

import { revalidatePath } from 'next/cache'
import { notFound, redirect } from 'next/navigation'
import { NotFoundError, requirePermission } from '@/auth'
import { withAuditLogging } from '@/server/actions/audit-helpers'
import {
  createAdminCourse,
  getAdminCourseCategories,
  setAdminCoursePublishState,
  updateAdminCourseById,
} from '@/server/services/course.service'
import { z } from 'zod'

const courseFieldsSchema = z.object({
  title: z.string().trim().min(1, 'Course title is required.').max(200, 'Course title is too long.'),
  slug: z.string().trim().min(1, 'Course slug is required.').max(200, 'Course slug is too long.'),
  description: z.string().max(10000, 'Course description is too long.'),
  categoryId: z.string().trim().max(200).transform((value) => value || null),
})

const updateCourseSchema = z.object({
  title: z.string().trim().min(1, 'Course title is required.').max(200, 'Course title is too long.'),
  slug: z.string().trim().min(1, 'Course slug is required.').max(200, 'Course slug is too long.'),
  description: z.string().max(10000, 'Course description is too long.'),
  categoryId: z.string().trim().max(200).transform((value) => value || null).optional(),
})

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
}

async function isValidCategory(categoryId: string | null | undefined): Promise<boolean> {
  if (!categoryId) return true
  return Boolean(await (await getAdminCourseCategories()).find((category) => category.id === categoryId))
}

export async function createAdminCourseAction(formData: FormData) {
  await requirePermission('manageCourses')

  const parsed = courseFieldsSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description') ?? '',
    categoryId: formData.get('categoryId') ?? '',
  })
  if (!parsed.success) redirect('/admin/courses/new?error=invalid')
  if (!(await isValidCategory(parsed.data.categoryId))) redirect('/admin/courses/new?error=category')

  try {
    const created = await withAuditLogging({
      permission: 'manageCourses',
      action: 'course.create',
      entityType: 'COURSE',
      metadata: { source: 'admin-courses' },
      run: () => createAdminCourse({
        ...parsed.data,
        description: parsed.data.description || null,
      }),
    })
    revalidatePath('/admin/courses')
    revalidatePath('/student/courses')
    revalidatePath('/admin/publishing')
    redirect(`/admin/courses/${created.id}?created=1`)
  } catch (error) {
    if (isUniqueConstraintError(error)) redirect('/admin/courses/new?error=slug')
    throw error
  }
}

export async function updateAdminCourseAction(courseId: string, formData: FormData) {
  await requirePermission('manageCourses')

  const coursePath = `/admin/courses/${courseId}`
  const parsed = updateCourseSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description') ?? '',
    ...(formData.has('categoryId') ? { categoryId: formData.get('categoryId') } : {}),
  })
  if (!parsed.success) redirect(`${coursePath}?error=invalid`)
  if (!(await isValidCategory(parsed.data.categoryId))) redirect(`${coursePath}?error=category`)

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
        revalidatePath('/student/courses')
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

export async function setAdminCoursePublishStateAction(courseId: string, status: 'DRAFT' | 'PUBLISHED') {
  await requirePermission('manageCourses')
  if (status !== 'DRAFT' && status !== 'PUBLISHED') throw new Error('Unsupported course publication state.')

  await withAuditLogging({
    permission: 'manageCourses',
    action: status === 'PUBLISHED' ? 'course.publish' : 'course.unpublish',
    entityType: 'COURSE',
    entityId: courseId,
    metadata: { source: 'admin-courses', status },
    run: async () => {
      const updated = await setAdminCoursePublishState(courseId, status)
      if (!updated) throw new NotFoundError('Course not found.')
      return updated
    },
  })

  revalidatePath('/admin/courses')
  revalidatePath(`/admin/courses/${courseId}`)
  revalidatePath('/student/courses')
}