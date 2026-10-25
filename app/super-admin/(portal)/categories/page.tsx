import { requireApprovedRole } from '@/auth'
import SuperAdminPageHeader from '@/components/super-admin/SuperAdminPageHeader'
import { createCategoryAction } from '@/server/actions/category-management.actions'
import {
  getManagedCategories,
  isCategoryManagementAvailable,
} from '@/server/services/category-management.service'

export default async function SuperAdminCategoriesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireApprovedRole('SUPER_ADMIN')

  if (!isCategoryManagementAvailable()) {
    return (
      <div className="space-y-6">
        <SuperAdminPageHeader title="Course Categories" description="Manage the categories used to organize courses." />
        <p role="status" className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Category creation is disabled in Production. Use a Preview deployment to manage test categories.
        </p>
      </div>
    )
  }

  const [categories, query] = await Promise.all([
    getManagedCategories(),
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ])
  const error = typeof query.error === 'string' ? query.error : null
  const created = query.created === '1'

  return (
    <div className="space-y-6">
      <SuperAdminPageHeader
        title="Course Categories"
        description="Create categories for course classification. New categories are active immediately and can be assigned when creating or editing a course."
      />

      {created ? <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Category created and available for course assignment.</p> : null}
      {error === 'invalid' ? <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">Enter a valid category title and slug.</p> : null}
      {error === 'duplicate' ? <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">That slug is already in use. Choose a unique slug.</p> : null}

      <section aria-labelledby="create-category-heading" className="max-w-3xl space-y-4 rounded-md border border-slate-200 bg-white p-5 sm:p-6">
        <h2 id="create-category-heading" className="text-lg font-semibold text-slate-950">Create category</h2>
        <form action={createCategoryAction} className="space-y-4">
          <label className="grid gap-1.5 text-sm font-medium text-slate-800">
            Category title
            <input name="title" required maxLength={120} className="min-h-11 rounded-md border border-slate-300 px-3 text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-800">
            Slug
            <input name="slug" required maxLength={100} pattern="[A-Za-z0-9]+(-[A-Za-z0-9]+)*" aria-describedby="category-slug-help" className="min-h-11 rounded-md border border-slate-300 px-3 text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" />
            <span id="category-slug-help" className="text-xs font-normal text-slate-500">Use letters, numbers, and single hyphens. The slug is stored in lowercase.</span>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-800">
            Description
            <textarea name="description" rows={3} maxLength={2000} className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" />
          </label>
          <button type="submit" className="min-h-10 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">Create category</button>
        </form>
      </section>

      <section aria-labelledby="active-categories-heading" className="space-y-3">
        <h2 id="active-categories-heading" className="text-lg font-semibold text-slate-950">Active categories</h2>
        {categories.length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">No active categories are available yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
            {categories.map((category) => (
              <li key={category.id} className="px-4 py-3">
                <p className="font-medium text-slate-900">{category.title}</p>
                <p className="text-sm text-slate-500">{category.slug}</p>
                {category.description ? <p className="mt-1 text-sm text-slate-600">{category.description}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
