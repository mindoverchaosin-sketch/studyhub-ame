import { redirect } from 'next/navigation'
import { requirePermission } from '@/auth'
import ContentEditorLayout from '@/components/content-editor/ContentEditorLayout'
import PageHeader from '@/components/admin/PageHeader'
import ModuleDirectoryPanel from '@/components/admin/modules/ModuleDirectoryPanel'
import { createModuleFormAction } from '@/server/actions/content-management.actions'
import { ModuleManagementService } from '@/server/services/module-management.service'

export default async function ModulesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  try {
    await requirePermission('manageModules')
  } catch {
    redirect('/unauthorized?reason=access-denied')
  }

  const params = (await searchParams) ?? {}
  const query = typeof params.query === 'string' ? params.query : ''
  const examType = typeof params.examType === 'string' ? params.examType : 'ALL'
  const status = typeof params.status === 'string' ? params.status : 'ALL'
  const sortBy = typeof params.sortBy === 'string' ? params.sortBy : 'updated'
  const page = Number(typeof params.page === 'string' ? params.page : '1') || 1

  const service = new ModuleManagementService()
  const directory = await service.listModules({
    search: query,
    examType:
      examType === 'DGCA' || examType === 'EASA' || examType === 'BOTH'
        ? examType
        : 'ALL',
    status:
      status === 'DRAFT' ||
      status === 'PUBLISHED' ||
      status === 'ARCHIVED' ||
      status === 'SCHEDULED'
        ? status
        : 'ALL',
    sortBy: sortBy === 'title' || sortBy === 'created' ? sortBy : 'updated',
    page,
    pageSize: 10,
  })

  return (
    <ContentEditorLayout>
      <div className="space-y-6">
        <PageHeader
          title="Module management"
          description="Create, edit, and manage training modules for your courses."
        />

        <form
          action={async (formData: FormData) => {
            'use server'
            await createModuleFormAction(formData)
          }}
          className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Create module
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Create a new module with a title, slug, and exam pathway.
              </p>
            </div>
            <button
              type="submit"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Create module
            </button>
          </div>
        </form>

        <ModuleDirectoryPanel
          directory={directory}
          query={query}
          examType={examType}
          status={status}
          sortBy={sortBy}
          page={page}
        />
      </div>
    </ContentEditorLayout>
  )
}
