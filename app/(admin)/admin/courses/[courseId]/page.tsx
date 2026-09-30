import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { requirePermission } from '@/auth'
import PageHeader from '@/features/admin/components/PageHeader'
import { updateAdminCourseAction } from '@/server/actions/course-management.actions'
import { getAdminCourseById } from '@/server/services/course.service'

export default async function AdminCourseEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  try {
    await requirePermission('manageCourses')
  } catch {
    redirect('/login')
  }

  const [{ courseId }, query] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ])
  const course = await getAdminCourseById(courseId)
  if (!course) notFound()

  const error = typeof query.error === 'string' ? query.error : null
  const saved = query.saved === '1'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit course"
        description="Update course details without changing its category or attached modules."
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Courses', href: '/admin/courses' },
          { label: course.title },
        ]}
      />

      {saved ? <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Course changes saved.</p> : null}
      {error === 'invalid' ? <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">Enter a valid title, slug, and description.</p> : null}
      {error === 'slug' ? <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">That slug is already in use. Choose a unique slug.</p> : null}

      <form action={updateAdminCourseAction.bind(null, course.id)} className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <section className="space-y-5 rounded-md border border-slate-200 bg-white p-5 sm:p-6" aria-label="Course details">
          <label className="grid gap-1.5 text-sm font-medium text-slate-800">
            Course title
            <input name="title" required maxLength={200} defaultValue={course.title} className="min-h-11 rounded-md border border-slate-300 px-3 text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-800">
            Slug
            <input name="slug" required maxLength={200} defaultValue={course.slug} className="min-h-11 rounded-md border border-slate-300 px-3 text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-800">
            Description
            <textarea name="description" rows={5} maxLength={10000} defaultValue={course.description ?? ''} className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" />
          </label>
          <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
            <button type="submit" className="min-h-10 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">Save changes</button>
            <Link href="/admin/courses" className="inline-flex min-h-10 items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Back to courses</Link>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-md border border-slate-200 bg-white p-5" aria-label="Course classification">
            <h2 className="font-semibold text-slate-950">Course classification</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div><dt className="text-slate-500">Exam type</dt><dd className="mt-1 font-medium text-slate-900">{course.categoryTitle ?? course.categoryId ?? 'General'}</dd></div>
              <div><dt className="text-slate-500">Publication state</dt><dd className="mt-1 font-medium text-slate-900">{course.status.replaceAll('_', ' ')}</dd></div>
              <div><dt className="text-slate-500">Premium access</dt><dd className="mt-1 font-medium text-slate-900">{course.isPremium ? 'Premium' : 'Standard'}</dd></div>
              <div><dt className="text-slate-500">Published at</dt><dd className="mt-1 font-medium text-slate-900">{course.publishedAt ? new Date(course.publishedAt).toLocaleString() : 'Not published'}</dd></div>
            </dl>
          </section>

          <section className="overflow-hidden rounded-md border border-slate-200 bg-white" aria-label="Attached modules">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-slate-950">Attached modules</h2>
              <p className="mt-1 text-sm text-slate-500">{course.modules.length} module{course.modules.length === 1 ? '' : 's'} · assignments are unchanged by this form</p>
            </div>
            {course.modules.length ? (
              <ul className="divide-y divide-slate-100">
                {course.modules.map((module) => (
                  <li key={module.id} className="flex items-start justify-between gap-4 px-5 py-3">
                    <div className="min-w-0">
                      <Link href={`/admin/modules/${module.id}`} className="font-medium text-slate-900 hover:text-blue-800">{module.title}</Link>
                      <p className="mt-0.5 text-xs text-slate-500">Module {module.moduleNumber} · {module.slug}</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-slate-600">{module.status.replaceAll('_', ' ')}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="px-5 py-5 text-sm text-slate-500">No modules are attached to this course.</p>}
          </section>
        </aside>
      </form>
    </div>
  )
}