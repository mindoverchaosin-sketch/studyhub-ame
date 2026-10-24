import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requirePermission } from '@/auth'
import PageHeader from '@/features/admin/components/PageHeader'
import { createAdminCourseAction } from '@/server/actions/course-management.actions'
import { getAdminCourseCategories } from '@/server/services/course.service'

export default async function AdminCourseCreatePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  try {
    await requirePermission('manageCourses')
  } catch {
    redirect('/login')
  }

  const [categories, query] = await Promise.all([
    getAdminCourseCategories(),
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ])
  const error = typeof query.error === 'string' ? query.error : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create course"
        description="Create a draft course and optionally assign it to an existing category."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Courses', href: '/admin/courses' },
          { label: 'Create course' },
        ]}
      />

      {error === 'invalid' ? <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">Enter a valid title, slug, description, and category.</p> : null}
      {error === 'slug' ? <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">That slug is already in use. Choose a unique slug.</p> : null}
      {error === 'category' ? <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">Choose an available category.</p> : null}

      <form action={createAdminCourseAction} className="max-w-3xl space-y-5 rounded-md border border-slate-200 bg-white p-5 sm:p-6">
        <label className="grid gap-1.5 text-sm font-medium text-slate-800">
          Course title
          <input name="title" required maxLength={200} className="min-h-11 rounded-md border border-slate-300 px-3 text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-800">
          Slug
          <input name="slug" required maxLength={200} className="min-h-11 rounded-md border border-slate-300 px-3 text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-800">
          Description
          <textarea name="description" rows={5} maxLength={10000} className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-800">
          Category
          <select name="categoryId" defaultValue="" className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            <option value="">No category</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}
          </select>
        </label>
        {!categories.length ? <p className="text-sm text-slate-500">No active categories are available. You can create this course without a category.</p> : null}
        <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
          <button type="submit" className="min-h-10 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">Create draft course</button>
          <Link href="/admin/courses" className="inline-flex min-h-10 items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
